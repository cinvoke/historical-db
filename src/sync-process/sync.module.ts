import { Module } from '@nestjs/common';
import { SyncService } from './services/sync/sync.service';
import { CasinocoinAPI } from '@casinocoin/libjs';
import * as config from 'yaml-config';
const settings = config.readConfig('config.yml');

@Module({
    providers: [SyncService],
})
export class SyncModule {

    public ledgerActually;

    constructor(private readonly syncService: SyncService) {
        const cscApi: CasinocoinAPI = new CasinocoinAPI({ server: settings.casinocoinServer });
        cscApi.connect().then( async () => {
            // get the current server_info
            cscApi.getServerInfo().then(info => {
                console.log('CSC Server: Connected');
            });
                // get Ledger Actually
            this.ledgerActually = await cscApi.getLedgerVersion();
            console.log(this.ledgerActually);
        }).catch(console.error);
    }
    console: any;
}
