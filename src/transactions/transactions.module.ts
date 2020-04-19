import { Module } from '@nestjs/common';
import { TransactionsController } from './controllers/transactions.controller';
import { TransactionsService } from './services/transactions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transactions } from './entity/transaction.entity';
import { SyncService } from '../sync-process/services/sync.service';
import { AccVersionService } from '../account-version/services/acc-version.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transactions])],
  controllers: [TransactionsController],
  providers: [TransactionsService, SyncService, AccVersionService],
})
export class TransactionsModule {}
