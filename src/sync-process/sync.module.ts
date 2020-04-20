import { Module } from '@nestjs/common';
import { SyncService } from './services/sync.service';
import { SyncTransactionsService } from './services/syncTransaction.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transactions } from '../transactions/entity/transaction.entity';
import { Accounts } from '../accounts/entity/account.entity';
import { TransactionsService } from '../transactions/services/transactions.service';
import { AccountsService } from '../accounts/services/accounts.service';
import { AccountVersions } from '../account-version/entity/accountVersion.entity';
import { AccVersionService } from '../account-version/services/acc-version.service';
import { LedgersService } from '../ledgers/services/ledgers.service';
import { Ledgers } from '../ledgers/entity/ledger.entity';


@Module({
    imports: [
        TypeOrmModule.forFeature([Transactions, Accounts, AccountVersions, Ledgers]),
    ],
    providers: [SyncService, TransactionsService, AccVersionService, AccountsService, LedgersService],
    exports: [SyncService],
})
export class SyncModule {

    constructor() { }
}
