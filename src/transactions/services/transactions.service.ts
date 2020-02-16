import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Transactions } from '../entity/transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transactions)
    private readonly transactionRepository: Repository<Transactions>,
  ) {}

  async getAll(): Promise<Transactions[]> {
    return await this.transactionRepository.find();
  }

  async getTransaction(ledgerHash) {
    console.log('ledgerHash', ledgerHash);
    const findTx = await this.transactionRepository.findOne({ledgerHash});
    console.log('findTx', findTx);
    return findTx;
  }

  async findTxMe(account) {
    return await this.transactionRepository.query(`
      SELECT *
      FROM transactions
      WHERE specification -> 'source' ->> 'address' = '${account}'
    `);
  }

  async getLimitedTransactions(body) {
    const { skip, take } = body;
    return await this.transactionRepository.createQueryBuilder('transactions')
      .select()
      .skip(skip) // number of tx to skip first
      .take(take) // take number tx
      .getMany();
  }

  async getLimitedTransactionsByAccount(body) {
    const { skip, take, account } = body;
    return await this.transactionRepository.createQueryBuilder('transactions')
      .where('transactions.accountId = :accountId', { accountId: account })
      .skip(skip) // number of tx to skip first
      .take(take) // take number tx
      .getMany();
  }
}
