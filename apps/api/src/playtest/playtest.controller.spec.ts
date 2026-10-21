import { Test, TestingModule } from '@nestjs/testing';
import { PlaytestController } from './playtest.controller';
import { PlaytestService } from './playtest.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

describe('PlaytestController', () => {
  let controller: PlaytestController;
  let service: PlaytestService;

  const mockSession = {
    id: 'pt-1',
    projectId: 'proj-1',
    title: 'Alpha Test',
    isActive: true,
    playableBuild: {
      id: 'build-1',
      version: 'v0.1.0',
      title: 'Combat Slice',
      platform: 'WINDOWS',
      fileSizeBytes: '250000000',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    createPlaytest: jest.fn().mockResolvedValue(mockSession),
    getPlaytests: jest.fn().mockResolvedValue([mockSession]),
    getPlaytest: jest.fn().mockResolvedValue(mockSession),
    updatePlaytest: jest.fn().mockResolvedValue(mockSession),
    deletePlaytest: jest.fn().mockResolvedValue({ success: true }),
    createFeedback: jest.fn(),
    getFeedbackList: jest.fn(),
    updateFeedback: jest.fn(),
    convertFeedbackToTask: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaytestController],
      providers: [
        {
          provide: PlaytestService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OptionalJwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PlaytestController>(PlaytestController);
    service = module.get<PlaytestService>(PlaytestService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createPlaytest calls service and returns serializable response', async () => {
    const res = await controller.createPlaytest(
      'proj-1',
      'build-1',
      { id: 'user-1', email: 'u@test.com', role: 'FOUNDER' },
      { title: 'Alpha Test' },
    );
    expect(service.createPlaytest).toHaveBeenCalledWith(
      'proj-1',
      'build-1',
      { title: 'Alpha Test' },
      'user-1',
      'FOUNDER',
    );
    expect(res).toEqual(mockSession);
    expect(() => JSON.stringify(res)).not.toThrow();
  });

  it('getPlaytests calls service and returns serializable list', async () => {
    const res = await controller.getPlaytests('proj-1', {
      id: 'user-1',
      email: 'u@test.com',
      role: 'MEMBER',
    });
    expect(service.getPlaytests).toHaveBeenCalledWith(
      'proj-1',
      'user-1',
      'MEMBER',
    );
    expect(res).toEqual([mockSession]);
    expect(() => JSON.stringify(res)).not.toThrow();
  });

  it('getPlaytest calls service and returns serializable single session', async () => {
    const res = await controller.getPlaytest('proj-1', 'pt-1', {
      id: 'user-1',
      email: 'u@test.com',
      role: 'MEMBER',
    });
    expect(service.getPlaytest).toHaveBeenCalledWith(
      'proj-1',
      'pt-1',
      'user-1',
      'MEMBER',
    );
    expect(res).toEqual(mockSession);
    expect(() => JSON.stringify(res)).not.toThrow();
  });
});
