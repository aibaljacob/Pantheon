import { Test, TestingModule } from '@nestjs/testing';
import { GitService } from './git.service';
import { NotFoundException } from '@nestjs/common';
import * as child_process from 'child_process';
import * as fs from 'fs/promises';
import { EventEmitter } from 'events';

jest.mock('child_process');
jest.mock('fs/promises');

describe('GitService', () => {
  let service: GitService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [GitService],
    }).compile();

    service = module.get<GitService>(GitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execGit', () => {
    it('should execute git command successfully', async () => {
      const mockSpawn = jest
        .spyOn(child_process, 'spawn')
        .mockImplementation(() => {
          const ee = new EventEmitter() as any;
          ee.stdout = new EventEmitter();
          ee.stderr = new EventEmitter();
          setTimeout(() => {
            ee.stdout.emit('data', 'success output');
            ee.emit('close', 0);
          }, 10);
          return ee;
        });

      const result = await (service as any).execGit(['status']);
      expect(result).toBe('success output');
      expect(mockSpawn).toHaveBeenCalledWith(
        'git',
        ['status'],
        expect.any(Object),
      );
    });

    it('should throw an error if git command fails', async () => {
      jest.spyOn(child_process, 'spawn').mockImplementation(() => {
        const ee = new EventEmitter() as any;
        ee.stdout = new EventEmitter();
        ee.stderr = new EventEmitter();
        setTimeout(() => {
          ee.stderr.emit('data', 'some error');
          ee.emit('close', 1);
        }, 10);
        return ee;
      });

      await expect((service as any).execGit(['invalid'])).rejects.toThrow(
        'Git command failed with code 1. Stderr: some error',
      );
    });
  });

  describe('initBareRepository', () => {
    it('should initialize a bare repository', async () => {
      const mockMkdir = jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      const mockExecGit = jest
        .spyOn(service as any, 'execGit')
        .mockResolvedValue('');

      await service.initBareRepository('/repo/path', 'main');

      expect(mockMkdir).toHaveBeenCalled();
      expect(mockExecGit).toHaveBeenCalledWith([
        'init',
        '--bare',
        '--initial-branch=main',
        '/repo/path',
      ]);
    });
  });

  describe('listBranches', () => {
    it('should parse for-each-ref output correctly', async () => {
      jest.spyOn(service as any, 'isValidRepository').mockResolvedValue(true);
      jest
        .spyOn(service as any, 'execGit')
        .mockImplementation(async (args: string[]) => {
          if (args.includes('HEAD')) {
            if (args.includes('symbolic-ref')) return 'refs/heads/main\n';
            return 'somehash\n'; // HEAD check
          }
          if (args.includes('for-each-ref')) {
            return 'main|hash1\ndev|hash2\n';
          }
          return '';
        });

      const branches = await service.listBranches('/repo');
      expect(branches).toHaveLength(2);
      expect(branches[0]).toEqual({
        name: 'main',
        isDefault: true,
        lastCommitHash: 'hash1',
      });
      expect(branches[1]).toEqual({
        name: 'dev',
        isDefault: false,
        lastCommitHash: 'hash2',
      });
    });

    it('should return empty array for empty repository', async () => {
      jest.spyOn(service as any, 'isValidRepository').mockResolvedValue(true);
      jest
        .spyOn(service as any, 'execGit')
        .mockImplementation(async (args: string[]) => {
          if (args.includes('HEAD')) {
            throw new Error(
              "fatal: ambiguous argument 'HEAD': unknown revision or path not in the working tree.",
            );
          }
          return '';
        });

      const branches = await service.listBranches('/repo');
      expect(branches).toEqual([]);
    });
  });

  describe('listCommits', () => {
    it('should parse git log output', async () => {
      jest
        .spyOn(service as any, 'execGit')
        .mockResolvedValue(
          'hash1|msg1|author1|email1|date1\nhash2|msg2|author2|email2|date2\n',
        );

      const commits = await service.listCommits('/repo', 'main');
      expect(commits).toHaveLength(2);
      expect(commits[0].hash).toBe('hash1');
      expect(commits[0].message).toBe('msg1');
      expect(commits[0].authorName).toBe('author1');
    });

    it('should return empty array if branch has no commits', async () => {
      jest
        .spyOn(service as any, 'execGit')
        .mockRejectedValue(new Error('fatal: ambiguous argument'));
      const commits = await service.listCommits('/repo', 'main');
      expect(commits).toEqual([]);
    });
  });

  describe('getTree', () => {
    it('should parse ls-tree output', async () => {
      const mockOutput =
        '100644 blob hash1 1234\tfile1.txt\n040000 tree hash2 -\tdir1\n';
      jest.spyOn(service as any, 'execGit').mockResolvedValue(mockOutput);

      const tree = await service.getTree('/repo', 'main', '');
      expect(tree).toHaveLength(2);
      expect(tree[0]).toEqual({
        mode: '100644',
        type: 'blob',
        hash: 'hash1',
        size: 1234,
        path: 'file1.txt',
      });
      expect(tree[1]).toEqual({
        mode: '040000',
        type: 'tree',
        hash: 'hash2',
        size: undefined,
        path: 'dir1',
      });
    });

    it('should throw NotFoundException if path is invalid', async () => {
      jest
        .spyOn(service as any, 'execGit')
        .mockRejectedValue(
          new Error('fatal: Not a valid object name main:invalid'),
        );
      await expect(service.getTree('/repo', 'main', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should support recursive tree listing with -r flag', async () => {
      const mockOutput =
        '100644 blob hash1 1234\tsrc/file1.txt\n100644 blob hash2 5678\tsrc/sub/file2.txt\n';
      const execSpy = jest
        .spyOn(service as any, 'execGit')
        .mockResolvedValue(mockOutput);

      const tree = await service.getTree('/repo', 'main', '', true);
      expect(tree).toHaveLength(2);
      expect(tree[0].path).toBe('src/file1.txt');
      expect(tree[1].path).toBe('src/sub/file2.txt');
      expect(execSpy).toHaveBeenCalledWith([
        '--git-dir',
        '/repo',
        'ls-tree',
        '-l',
        '-r',
        'main',
      ]);
    });
  });

  describe('getFileContent', () => {
    it('should fetch blob content', async () => {
      jest
        .spyOn(service as any, 'execGit')
        .mockResolvedValue('file content here');
      const content = await service.getFileContent('/repo', 'main', 'file.txt');
      expect(content).toBe('file content here');
    });

    it('should throw NotFoundException if file is invalid', async () => {
      jest
        .spyOn(service as any, 'execGit')
        .mockRejectedValue(new Error('fatal: Not a valid object name'));
      await expect(
        service.getFileContent('/repo', 'main', 'invalid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBlobsBatch', () => {
    it('should return empty map for empty hashes array without spawning process', async () => {
      const mockSpawn = jest.spyOn(child_process, 'spawn');
      const result = await service.getBlobsBatch('/repo', []);
      expect(result.size).toBe(0);
      expect(mockSpawn).not.toHaveBeenCalled();
    });

    it('should retrieve multiple blob contents in a single process', async () => {
      jest.spyOn(child_process, 'spawn').mockImplementation(() => {
        const ee = new EventEmitter() as any;
        ee.stdout = new EventEmitter();
        ee.stderr = new EventEmitter();
        ee.stdin = { write: jest.fn(), end: jest.fn() };
        setTimeout(() => {
          const payload =
            'hash1 blob 11\nhello world\nhash2 blob 14\nsecond content\n';
          ee.stdout.emit('data', Buffer.from(payload));
          ee.emit('close', 0);
        }, 10);
        return ee;
      });

      const result = await service.getBlobsBatch('/repo', ['hash1', 'hash2']);
      expect(result.size).toBe(2);
      expect(result.get('hash1')).toBe('hello world');
      expect(result.get('hash2')).toBe('second content');
    });

    it('should handle missing blobs gracefully', async () => {
      jest.spyOn(child_process, 'spawn').mockImplementation(() => {
        const ee = new EventEmitter() as any;
        ee.stdout = new EventEmitter();
        ee.stderr = new EventEmitter();
        ee.stdin = { write: jest.fn(), end: jest.fn() };
        setTimeout(() => {
          const payload = 'hash1 blob 5\nhello\nhash2 missing\n';
          ee.stdout.emit('data', Buffer.from(payload));
          ee.emit('close', 0);
        }, 10);
        return ee;
      });

      const result = await service.getBlobsBatch('/repo', ['hash1', 'hash2']);
      expect(result.size).toBe(2);
      expect(result.get('hash1')).toBe('hello');
      expect(result.get('hash2')).toBe('');
    });
  });

  describe('getCommitInfo', () => {
    it('should parse git log -1 output correctly', async () => {
      jest
        .spyOn(service as any, 'execGit')
        .mockResolvedValue(
          'hash123|feat: add jump|Developer|dev@pantheon.studio|2026-01-01T12:00:00Z\n',
        );

      const result = await service.getCommitInfo('/repo/path', 'hash123');

      expect(result).toEqual({
        hash: 'hash123',
        message: 'feat: add jump',
        authorName: 'Developer',
        authorEmail: 'dev@pantheon.studio',
        date: '2026-01-01T12:00:00Z',
      });
    });

    it('should throw NotFoundException if commit does not exist', async () => {
      jest
        .spyOn(service as any, 'execGit')
        .mockRejectedValue(new Error('fatal: bad object nonexistent'));

      await expect(
        service.getCommitInfo('/repo/path', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCommitChangedFiles', () => {
    it('should parse added file correctly', async () => {
      jest
        .spyOn(service as any, 'execGit')
        .mockResolvedValue('A\tsrc/player/Movement.ts\n');

      const result = await service.getCommitChangedFiles(
        '/repo/path',
        'hash123',
      );

      expect(result).toEqual([
        {
          status: 'ADDED',
          path: 'src/player/Movement.ts',
        },
      ]);
    });

    it('should parse modified file correctly', async () => {
      jest
        .spyOn(service as any, 'execGit')
        .mockResolvedValue('M\tsrc/player/Input.ts\n');

      const result = await service.getCommitChangedFiles(
        '/repo/path',
        'hash123',
      );

      expect(result).toEqual([
        {
          status: 'MODIFIED',
          path: 'src/player/Input.ts',
        },
      ]);
    });

    it('should parse deleted file correctly', async () => {
      jest
        .spyOn(service as any, 'execGit')
        .mockResolvedValue('D\tsrc/old/LegacyPhysics.ts\n');

      const result = await service.getCommitChangedFiles(
        '/repo/path',
        'hash123',
      );

      expect(result).toEqual([
        {
          status: 'DELETED',
          path: 'src/old/LegacyPhysics.ts',
        },
      ]);
    });

    it('should parse renamed file with old and new path correctly', async () => {
      jest
        .spyOn(service as any, 'execGit')
        .mockResolvedValue('R100\tsrc/old/Player.ts\tsrc/new/Player.ts\n');

      const result = await service.getCommitChangedFiles(
        '/repo/path',
        'hash123',
      );

      expect(result).toEqual([
        {
          status: 'RENAMED',
          oldPath: 'src/old/Player.ts',
          path: 'src/new/Player.ts',
        },
      ]);
    });

    it('should parse multiple changed files in a commit', async () => {
      const gitOutput = [
        'A\ttests/player.test.ts',
        'M\tsrc/player/Player.ts',
        'D\tsrc/player/OldInput.ts',
        'R095\tsrc/assets/old_tex.png\tsrc/assets/new_tex.png',
      ].join('\n');

      jest.spyOn(service as any, 'execGit').mockResolvedValue(gitOutput);

      const result = await service.getCommitChangedFiles(
        '/repo/path',
        'hash123',
      );

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        status: 'ADDED',
        path: 'tests/player.test.ts',
      });
      expect(result[1]).toEqual({
        status: 'MODIFIED',
        path: 'src/player/Player.ts',
      });
      expect(result[2]).toEqual({
        status: 'DELETED',
        path: 'src/player/OldInput.ts',
      });
      expect(result[3]).toEqual({
        status: 'RENAMED',
        oldPath: 'src/assets/old_tex.png',
        path: 'src/assets/new_tex.png',
      });
    });

    it('should return empty array for commit with no changed files', async () => {
      jest.spyOn(service as any, 'execGit').mockResolvedValue('\n');

      const result = await service.getCommitChangedFiles(
        '/repo/path',
        'emptyhash',
      );

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException for invalid or nonexistent commit hash', async () => {
      jest
        .spyOn(service as any, 'execGit')
        .mockRejectedValue(
          new Error('fatal: Not a valid object name fakehash'),
        );

      await expect(
        service.getCommitChangedFiles('/repo/path', 'fakehash'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
