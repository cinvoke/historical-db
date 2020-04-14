import { Module } from '@nestjs/common';
import { SyncService } from './services/sync.service';
import { SyncTransactionsService } from './services/syncTransaction.service';


@Module({
    providers: [SyncService, SyncTransactionsService],
    exports: [SyncService ],
})
export class SyncModule {

    constructor() { }
}
