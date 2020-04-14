import { Test, TestingModule } from '@nestjs/testing';
import { CasinocoinService } from './casinocoin.service';

describe('CasinocoinService', () => {
  let service: CasinocoinService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CasinocoinService],
    }).compile();

    service = module.get<CasinocoinService>(CasinocoinService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
