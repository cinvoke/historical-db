import { Test, TestingModule } from '@nestjs/testing';
import { SpecialAccountController } from './special-account.controller';

describe('SpecialAccount Controller', () => {
  let controller: SpecialAccountController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpecialAccountController],
    }).compile();

    controller = module.get<SpecialAccountController>(SpecialAccountController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
