import { Test, TestingModule } from '@nestjs/testing';
import { PlaytestService } from './playtest.service';

describe('PlaytestService', () => {
  let service: PlaytestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlaytestService],
    }).compile();

    service = module.get<PlaytestService>(PlaytestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
