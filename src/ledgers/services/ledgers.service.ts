import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ledger } from '../entity/ledger.entity';

@Injectable()
export class LedgersService {
    constructor(
        @InjectRepository(Ledger)
        private readonly ledgerRepository: Repository<Ledger>,
      ) {}

      getAll(): Promise<Ledger[]> {
        return this.ledgerRepository.find();
      }
}
