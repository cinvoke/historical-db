import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entity/account.entity';

@Injectable()
export class AccountsService {
    constructor(
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,
      ) {}

      getAll(): Promise<Account[]> {
        return this.accountRepository.find();
      }
}
