import { Module } from '@nestjs/common';
import { TransactionsController } from './controllers/transactions.controller';
import { TransactionsService } from './services/transactions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transactions } from './entity/transaction.entity';
import { AccVersionService } from '../account-version/services/acc-version.service';
import { AccountVersions } from '../account-version/entity/accountVersion.entity';
import { Accounts } from '../accounts/entity/account.entity';
import { AccountsService } from '../accounts/services/accounts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transactions, AccountVersions, Accounts])],
  controllers: [TransactionsController],
  providers: [TransactionsService, AccVersionService, AccountsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
