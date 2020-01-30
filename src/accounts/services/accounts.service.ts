import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Accounts } from '../entity/account.entity';

@Injectable()
export class AccountsService {
    constructor(
      @InjectRepository(Accounts)
      private readonly accountRepository: Repository<Accounts>,
    ) {}

    getAll(): Promise<Accounts[]> {
      return this.accountRepository.find();
    }

    getAccount(account: string): Promise<Accounts> {
      return this.accountRepository.findOne({account});
    }
}
