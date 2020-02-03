import { Module } from '@nestjs/common';
import { SyncService } from './services/sync/sync.service';
import { CasinocoinAPI } from '@casinocoin/libjs';
import { SyncLedger } from './class/syncLedgers';
import * as config from 'yaml-config';
import { SyncTransactions } from './class/syncTransaction';
const settings = config.readConfig('config.yml');

@Module({
    providers: [SyncService],
})
export class SyncModule {

    constructor(private readonly syncService: SyncService) {
        const cscApi: CasinocoinAPI = new CasinocoinAPI({ server: settings.casinocoinServer });
        cscApi.connect().then( async () => {
            // get the current server_info
            cscApi.getServerInfo().then(info => {
                console.log('CSC Server: Connected');
            });
                // get Ledger Actually
            const ledgerActually = await cscApi.getLedgerVersion();
            // tslint:disable-next-line:no-unused-expression
            new SyncLedger(ledgerActually);
            // tslint:disable-next-line:no-unused-expression
            new SyncTransactions(ledgerActually);
        }).catch(console.error);
    }
    console: any;
}
