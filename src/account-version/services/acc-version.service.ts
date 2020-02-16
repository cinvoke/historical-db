import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountVersions } from '../entity/accountVersion.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AccVersionService {
    constructor(
    @InjectRepository(AccountVersions)
    private readonly transactionRepository: Repository<AccountVersions>,
    ) { }

    async getAccountVersion(body) {
    const { ledgerVersion, accountId } = body;
    return await this.transactionRepository.createQueryBuilder('accountVersion')
        .where('accountVersion.ledgerVersion = :ledgerVersion', { ledgerVersion })
        .andWhere('accountVersion.accountId = :accountId', { accountId })
        .getOne();
  }
}
