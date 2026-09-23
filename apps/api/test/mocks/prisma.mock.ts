import { PrismaService } from '../../src/prisma/prisma.service';

export const createMockPrismaService = () => {
  const createModelMock = () => ({
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    createMany: jest.fn().mockResolvedValue({ count: 0 }),
    update: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    delete: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    upsert: jest.fn().mockResolvedValue({}),
  });

  const mock: any = {
    user: createModelMock(),
    authSession: createModelMock(),
    emailVerificationToken: createModelMock(),
    passwordResetToken: createModelMock(),
    userProfile: createModelMock(),
    userExperience: createModelMock(),
    userEducation: createModelMock(),
    userLink: createModelMock(),
    userPortfolioItem: createModelMock(),
    userProfessionalIdentity: createModelMock(),
    userResume: createModelMock(),
    userFollow: createModelMock(),
    professionalRole: createModelMock(),
    specialization: createModelMock(),
    skill: createModelMock(),
    tool: createModelMock(),
    gameEngine: createModelMock(),
    genre: createModelMock(),
    platform: createModelMock(),
    userRole: createModelMock(),
    userSpecialization: createModelMock(),
    userSkill: createModelMock(),
    userTool: createModelMock(),
    userGameEngine: createModelMock(),
    userGenre: createModelMock(),
    userPlatform: createModelMock(),
    project: createModelMock(),
    projectMember: createModelMock(),
    projectRole: createModelMock(),
    projectRoleSkill: createModelMock(),
    projectRoleTool: createModelMock(),
    projectInvitation: createModelMock(),
    projectApplication: createModelMock(),
    projectRepository: createModelMock(),
    repoBranch: createModelMock(),
    repoCommit: createModelMock(),
    repoPullRequest: createModelMock(),
    repoRelease: createModelMock(),
    moderationAuditLog: createModelMock(),
    $transaction: jest.fn(async (arg: any) => {
      if (typeof arg === 'function') {
        return arg(mock);
      }
      return Promise.all(arg);
    }),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  return mock as unknown as jest.Mocked<PrismaService>;
};
