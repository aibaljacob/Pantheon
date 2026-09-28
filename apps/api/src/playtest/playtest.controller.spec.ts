import { Test, TestingModule } from '@nestjs/testing';
import { PlaytestController } from './playtest.controller';
import { PlaytestService } from './playtest.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

describe('PlaytestController', () => {
  let controller: PlaytestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaytestController],
      providers: [
        {
          provide: PlaytestService,
          useValue: {
            createSession: jest.fn(),
            listSessions: jest.fn(),
            getSession: jest.fn(),
            updateSession: jest.fn(),
            deleteSession: jest.fn(),
            createFeedback: jest.fn(),
            listFeedback: jest.fn(),
            updateFeedback: jest.fn(),
            deleteFeedback: jest.fn(),
            convertToTask: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OptionalJwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PlaytestController>(PlaytestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
