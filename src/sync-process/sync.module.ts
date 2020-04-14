import { Module, Logger } from '@nestjs/common';
import { SyncService } from './services/sync/sync.service';
import { SyncTransactionsService } from './class/syncTransaction.service';

@Module({
    providers: [SyncService, SyncTransactionsService],
})
export class SyncModule {

    constructor() { }
    console: any;
}
