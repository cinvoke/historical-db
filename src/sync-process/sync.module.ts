import { Module } from '@nestjs/common';
import { SyncService } from './services/sync.service';
import { SyncTransactionsService } from './services/syncTransaction.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transactions } from '../transactions/entity/transaction.entity';
import { Accounts } from '../accounts/entity/account.entity';
import { TransactionsService } from '../transactions/services/transactions.service';


@Module({
    imports: [
        TypeOrmModule.forFeature([Transactions, Accounts]),
    ],
    providers: [SyncService, TransactionsService],
})
export class SyncModule {

    constructor() { }
}
