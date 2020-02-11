import { Test, TestingModule } from '@nestjs/testing';
import { SpecialAccountService } from './special-account.service';

describe('SpecialAccountService', () => {
  let service: SpecialAccountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpecialAccountService],
    }).compile();

    service = module.get<SpecialAccountService>(SpecialAccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
