import { Module } from '@nestjs/common';
import { TransactionsController } from './controllers/transactions.controller';
import { TransactionsService } from './services/transactions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transactions } from './entity/transaction.entity';
import { AccVersionService } from '../account-version/services/acc-version.service';
import { AccountVersions } from '../account-version/entity/accountVersion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transactions, AccountVersions])],
  controllers: [TransactionsController],
  providers: [TransactionsService, AccVersionService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
