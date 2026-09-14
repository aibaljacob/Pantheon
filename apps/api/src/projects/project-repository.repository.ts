import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RepoPullRequestStatus, type Prisma } from '@prisma/client';

export interface CreateCommitData {
  repositoryId: string;
  hash: string;
  message: string;
  branchName: string;
  authorId: string;
  changedFiles: string[];
}

export interface UpsertFileData {
  repositoryId: string;
  branchId: string;
  path: string;
  content: string;
  size: number;
  linesCount: number;
  lastCommitId?: string;
}

export interface CreatePullRequestData {
  repositoryId: string;
  number: number;
  title: string;
  description?: string;
  sourceBranch: string;
  targetBranch: string;
  authorId: string;
}

export interface CreateReleaseData {
  repositoryId: string;
  tagName: string;
  title: string;
  description?: string;
  targetBranch: string;
  authorId: string;
  assets?: Prisma.InputJsonValue;
}

@Injectable()
export class ProjectRepositoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findProjectWithDetails(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        founder: {
          include: {
            profile: true,
          },
        },
        members: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });
  }

  async findRepositoryByProjectId(projectId: string) {
    return this.prisma.projectRepository.findUnique({
      where: { projectId },
      include: {
        branches: {
          orderBy: { createdAt: 'asc' },
        },
        commits: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              include: {
                profile: true,
              },
            },
          },
        },
        pullRequests: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              include: {
                profile: true,
              },
            },
            mergedBy: {
              include: {
                profile: true,
              },
            },
          },
        },
        releases: {
          orderBy: { publishedAt: 'desc' },
          include: {
            author: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });
  }

  async createRepository(projectId: string, defaultBranch: string = 'main') {
    return this.prisma.projectRepository.create({
      data: {
        projectId,
        defaultBranch,
        branches: {
          create: {
            name: defaultBranch,
            isDefault: true,
          },
        },
      },
      include: {
        branches: true,
      },
    });
  }

  async findBranchByName(repositoryId: string, branchName: string) {
    return this.prisma.repoBranch.findUnique({
      where: {
        repositoryId_name: {
          repositoryId,
          name: branchName,
        },
      },
      include: {
        files: {
          include: {
            lastCommit: {
              include: {
                author: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async createBranch(repositoryId: string, name: string, isDefault: boolean = false) {
    return this.prisma.repoBranch.create({
      data: {
        repositoryId,
        name,
        isDefault,
      },
    });
  }

  async getBranchFiles(branchId: string) {
    return this.prisma.repoFile.findMany({
      where: { branchId },
      include: {
        lastCommit: {
          include: {
            author: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
      orderBy: { path: 'asc' },
    });
  }

  async findFile(branchId: string, path: string) {
    return this.prisma.repoFile.findUnique({
      where: {
        branchId_path: {
          branchId,
          path,
        },
      },
      include: {
        lastCommit: {
          include: {
            author: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });
  }

  async upsertFile(data: UpsertFileData) {
    return this.prisma.repoFile.upsert({
      where: {
        branchId_path: {
          branchId: data.branchId,
          path: data.path,
        },
      },
      create: {
        repositoryId: data.repositoryId,
        branchId: data.branchId,
        path: data.path,
        content: data.content,
        size: data.size,
        linesCount: data.linesCount,
        lastCommitId: data.lastCommitId,
      },
      update: {
        content: data.content,
        size: data.size,
        linesCount: data.linesCount,
        lastCommitId: data.lastCommitId,
      },
    });
  }

  async deleteFile(branchId: string, path: string) {
    return this.prisma.repoFile.delete({
      where: {
        branchId_path: {
          branchId,
          path,
        },
      },
    });
  }

  async cloneFilesToBranch(
    repositoryId: string,
    targetBranchId: string,
    files: Array<{
      path: string;
      content: string;
      size: number;
      linesCount: number;
      lastCommitId?: string | null;
    }>,
  ) {
    if (files.length === 0) return;
    await this.prisma.repoFile.createMany({
      data: files.map((f) => ({
        repositoryId,
        branchId: targetBranchId,
        path: f.path,
        content: f.content,
        size: f.size,
        linesCount: f.linesCount,
        lastCommitId: f.lastCommitId,
      })),
    });
  }

  async createCommit(data: CreateCommitData) {
    return this.prisma.repoCommit.create({
      data: {
        repositoryId: data.repositoryId,
        hash: data.hash,
        message: data.message,
        branchName: data.branchName,
        authorId: data.authorId,
        changedFiles: data.changedFiles,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  async getCommitsByRepository(repositoryId: string, branchName?: string) {
    return this.prisma.repoCommit.findMany({
      where: {
        repositoryId,
        ...(branchName ? { branchName } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  async createPullRequest(data: CreatePullRequestData) {
    return this.prisma.repoPullRequest.create({
      data: {
        repositoryId: data.repositoryId,
        number: data.number,
        title: data.title,
        description: data.description,
        sourceBranch: data.sourceBranch,
        targetBranch: data.targetBranch,
        status: RepoPullRequestStatus.OPEN,
        authorId: data.authorId,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  async findPullRequestByNumber(repositoryId: string, prNumber: number) {
    return this.prisma.repoPullRequest.findUnique({
      where: {
        repositoryId_number: {
          repositoryId,
          number: prNumber,
        },
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        mergedBy: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  async markPullRequestMerged(prId: string, mergedById: string) {
    return this.prisma.repoPullRequest.update({
      where: { id: prId },
      data: {
        status: RepoPullRequestStatus.MERGED,
        mergedById,
        mergedAt: new Date(),
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        mergedBy: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  async createRelease(data: CreateReleaseData) {
    return this.prisma.repoRelease.create({
      data: {
        repositoryId: data.repositoryId,
        tagName: data.tagName,
        title: data.title,
        description: data.description,
        targetBranch: data.targetBranch,
        authorId: data.authorId,
        assets: data.assets ?? [],
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    });
  }
}
