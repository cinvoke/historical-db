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

      getAll(): Promise<Transactions[]> {
        return this.transactionRepository.find();
      }
}
