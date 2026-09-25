import { Test, TestingModule } from '@nestjs/testing';
import { PlaytestController } from './playtest.controller';

describe('PlaytestController', () => {
  let controller: PlaytestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaytestController],
    }).compile();

    controller = module.get<PlaytestController>(PlaytestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
