import { Test, TestingModule } from '@nestjs/testing';
import { AccVersionController } from './acc-version.controller';

describe('AccVersion Controller', () => {
  let controller: AccVersionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccVersionController],
    }).compile();

    controller = module.get<AccVersionController>(AccVersionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
