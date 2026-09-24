import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface GitCommitInfo {
  hash: string;
  message: string;
  authorName: string;
  authorEmail: string;
  date: string;
}

export interface GitTreeItem {
  mode: string;
  type: 'blob' | 'tree' | 'commit';
  hash: string;
  path: string;
  size?: number; // Size in bytes for blobs
}

@Injectable()
export class GitService {
  private readonly logger = new Logger(GitService.name);
  private readonly gitPath = process.env.PANTHEON_GIT_PATH || 'git';

  /**
   * Executes a git command safely using spawn.
   */
  private async execGit(args: string[], cwd?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.gitPath, args, { cwd, shell: false });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('error', (err) => {
        this.logger.error(`Failed to execute git ${args.join(' ')}: ${err.message}`);
        reject(new InternalServerErrorException(`Git execution failed: ${err.message}`));
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          const errorMsg = `Git command failed with code ${code}. Stderr: ${stderr.trim()}`;
          this.logger.warn(errorMsg);
          reject(new Error(errorMsg));
        } else {
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Checks if a directory is a valid bare git repository.
   */
  async isValidRepository(repoPath: string): Promise<boolean> {
    try {
      const output = await this.execGit(['--git-dir', repoPath, 'rev-parse', '--is-bare-repository']);
      return output.trim() === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Initializes a bare Git repository.
   */
  async initBareRepository(repoPath: string, defaultBranch: string = 'main'): Promise<void> {
    try {
      // Ensure the parent directory exists
      await fs.mkdir(path.dirname(repoPath), { recursive: true });
      await this.execGit(['init', '--bare', `--initial-branch=${defaultBranch}`, repoPath]);
      this.logger.log(`Initialized bare git repository at ${repoPath}`);
    } catch (err: any) {
      this.logger.error(`Failed to initialize bare repository: ${err.message}`);
      throw new InternalServerErrorException('Failed to initialize repository');
    }
  }

  /**
   * Lists all branches in the repository.
   */
  async listBranches(repoPath: string): Promise<{ name: string; isDefault: boolean; lastCommitHash: string }[]> {
    try {
      if (!(await this.isValidRepository(repoPath))) {
        throw new Error('Not a valid bare repository');
      }

      // Check if there are any commits at all
      try {
        await this.execGit(['--git-dir', repoPath, 'rev-parse', 'HEAD']);
      } catch (err: any) {
        if (err.message.includes('unknown revision') || err.message.includes('ambiguous argument')) {
          // Empty repository, no branches yet
          return [];
        }
      }

      const defaultBranchOutput = await this.execGit(['--git-dir', repoPath, 'symbolic-ref', '--short', 'HEAD']);
      const defaultBranch = defaultBranchOutput.trim().replace('refs/heads/', '');

      const output = await this.execGit(['--git-dir', repoPath, 'for-each-ref', '--format=%(refname:short)|%(objectname)', 'refs/heads/']);
      const lines = output.trim().split('\n').filter(Boolean);

      return lines.map((line) => {
        const [name, hash] = line.split('|');
        return {
          name,
          lastCommitHash: hash,
          isDefault: name === defaultBranch,
        };
      });
    } catch (err: any) {
      this.logger.error(`Failed to list branches: ${err.message}`);
      return [];
    }
  }

  /**
   * Gets the recent commits for a given branch or ref.
   */
  async listCommits(repoPath: string, branch: string, limit: number = 50): Promise<GitCommitInfo[]> {
    try {
      // Format: HASH|SUBJECT|AUTHOR_NAME|AUTHOR_EMAIL|DATE(ISO)
      const output = await this.execGit([
        '--git-dir', repoPath,
        'log',
        `-${limit}`,
        '--format=%H|%s|%an|%ae|%aI',
        branch
      ]);
      const lines = output.trim().split('\n').filter(Boolean);
      return lines.map(line => {
        const [hash, message, authorName, authorEmail, date] = line.split('|');
        return { hash, message, authorName, authorEmail, date };
      });
    } catch (err: any) {
      if (err.message.includes('unknown revision') || err.message.includes('ambiguous argument') || err.message.includes('bad revision')) {
        return [];
      }
      this.logger.error(`Failed to list commits for ${branch}: ${err.message}`);
      throw new InternalServerErrorException('Failed to list commits');
    }
  }

  /**
   * Lists the tree contents at a specific commit and path.
   */
  async getTree(repoPath: string, commitish: string, dirPath: string = ''): Promise<GitTreeItem[]> {
    try {
      // If path is empty, we just list the root of the commit
      // If path is provided, it needs to be formatted like commitish:dirPath
      const target = dirPath ? `${commitish}:${dirPath}` : commitish;
      
      const output = await this.execGit([
        '--git-dir', repoPath,
        'ls-tree',
        '-l', // Include object size for blobs
        target
      ]);
      
      const lines = output.trim().split('\n').filter(Boolean);
      return lines.map(line => {
        // ls-tree -l output format:
        // <mode> SP <type> SP <object> SP <object size> TAB <file>
        const match = line.match(/^(\d+)\s+(\w+)\s+(\S+)\s+([\d-]+)\t(.+)$/);
        if (!match) {
          throw new Error(`Failed to parse ls-tree output line: ${line}`);
        }
        
        const [, mode, type, hash, sizeStr, filePath] = match;
        return {
          mode,
          type: type as 'blob' | 'tree' | 'commit',
          hash,
          path: filePath,
          size: sizeStr !== '-' ? parseInt(sizeStr, 10) : undefined,
        };
      });
    } catch (err: any) {
      if (err.message.includes('Not a valid object name')) {
        throw new NotFoundException(`Path ${dirPath} not found in ${commitish}`);
      }
      this.logger.error(`Failed to get tree: ${err.message}`);
      throw new InternalServerErrorException('Failed to read repository tree');
    }
  }

  /**
   * Gets the content of a blob (file).
   */
  async getFileContent(repoPath: string, commitish: string, filePath: string): Promise<string> {
    try {
      const output = await this.execGit([
        '--git-dir', repoPath,
        'cat-file',
        '-p',
        `${commitish}:${filePath}`
      ]);
      return output;
    } catch (err: any) {
      if (err.message.includes('Not a valid object name')) {
        throw new NotFoundException(`File ${filePath} not found in ${commitish}`);
      }
      this.logger.error(`Failed to get file content: ${err.message}`);
      throw new InternalServerErrorException('Failed to read file content');
    }
  }

  /**
   * Helper to write a set of files to a temporary working tree and commit them.
   * Useful for the initial commit migration.
   */
  async createInitialCommitFromFiles(
    repoPath: string, 
    files: { path: string, content: string }[],
    message: string,
    authorName: string,
    authorEmail: string,
    defaultBranch: string = 'main'
  ): Promise<string> {
    const os = require('os');
    const crypto = require('crypto');
    const tempDir = path.join(os.tmpdir(), `pantheon-migration-${crypto.randomBytes(4).toString('hex')}`);
    
    try {
      await this.execGit(['clone', repoPath, tempDir]);
      
      for (const file of files) {
        const fullPath = path.join(tempDir, file.path);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, file.content, 'utf8');
      }

      await this.execGit(['add', '.'], tempDir);
      
      // Commit
      const env = { ...process.env, GIT_AUTHOR_NAME: authorName, GIT_AUTHOR_EMAIL: authorEmail, GIT_COMMITTER_NAME: authorName, GIT_COMMITTER_EMAIL: authorEmail };
      
      const proc = spawn(this.gitPath, ['commit', '-m', message], { cwd: tempDir, env, shell: false });
      await new Promise<void>((resolve, reject) => {
        proc.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Commit failed with code ${code}`));
        });
      });
      
      // Push back to the bare repository
      await this.execGit(['push', 'origin', `HEAD:refs/heads/${defaultBranch}`], tempDir);
      
      // Get the new commit hash
      const hash = await this.execGit(['--git-dir', repoPath, 'rev-parse', 'HEAD']);
      return hash.trim();
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
