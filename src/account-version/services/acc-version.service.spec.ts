import { Test, TestingModule } from '@nestjs/testing';
import { AccVersionService } from './acc-version.service';

describe('AccVersionService', () => {
  let service: AccVersionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccVersionService],
    }).compile();

    service = module.get<AccVersionService>(AccVersionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
