import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ledgers } from '../entity/ledger.entity';

@Injectable()
export class LedgersService {
    constructor(
        @InjectRepository(Ledgers)
        private readonly ledgerRepository: Repository<Ledgers>,
      ) {}

      getAll(): Promise<Ledgers[]> {
        return this.ledgerRepository.find();
      }
}
