import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SpecialAccount } from '../entity/specialAccount.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SpecialAccountService {

  constructor(
    @InjectRepository(SpecialAccount)
    private readonly specialAccountRepository: Repository<SpecialAccount>,
  ) {
  }

  getAll(): Promise<SpecialAccount[]> {
    return this.specialAccountRepository.find();
  }

  async insertSpecialAccount(body) {
    await this.specialAccountRepository.insert(body);
  }
}
