import { Module } from '@nestjs/common';
import { SyncService } from './services/sync.service';
import { SyncTransactionsService } from './services/syncTransaction.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transactions } from '../transactions/entity/transaction.entity';
import { Accounts } from '../accounts/entity/account.entity';


@Module({
    imports: [
        TypeOrmModule.forFeature([Transactions, Accounts]),
    ],
    providers: [SyncService, SyncTransactionsService],
})
export class SyncModule {

    constructor() { }
}
