import { Ledger} from './../../ledgers/entity/ledger.entity';
import { getRepository } from 'typeorm';
import { CasinocoinAPI } from '@casinocoin/libjs';
import { LedgerDto } from '../../ledgers/dto/ledgerDTO';
import * as config from 'yaml-config';
const settings = config.readConfig('config.yml');

export class SyncLedger {

    private LedgerRepository = getRepository(Ledger);
    private actualLeger;
    private cscApi: CasinocoinAPI = new CasinocoinAPI({ server: settings.casinocoinServer });

    constructor(ledger: number) {
        this.actualLeger = ledger;
        this.initSyncLedger();
    }

    private async initSyncLedger() {
        try {
            // Get Last Ledger From DataBase
            const LastLedgerDB = await this.getLastLedger();
            console.log('LastLedgerDB', LastLedgerDB, 'actualLegerCSC', this.actualLeger);

            // compare Last Ledger with leger actually and init Sync in Database
            if (!LastLedgerDB) { this.initSync(1, this.actualLeger); }

            if ( LastLedgerDB >= 1 && LastLedgerDB < this.actualLeger) { this.initSync( LastLedgerDB + 1, this.actualLeger); }

            if (LastLedgerDB > this.actualLeger) { return console.log('Database Is Actualized'); }
        } catch (error) {
            return console.log('Error initSyncLedger:', error.message);
        }
    }

    private initSync( initLedgerVersion: number, LastLegerVersion: number) {
        let iterator: number = initLedgerVersion;
        console.log('initLedgerVersion', initLedgerVersion, 'LastLegerVersion', LastLegerVersion);
        // const syncTx = new SyncTransaction(initLedgerVersion, LastLegerVersion);
        const ledgerVersionNotFound: number[] = [];
        this.cscApi.connect().then(async () => {
            while (iterator < LastLegerVersion) {
                try {
                    const LedgerFinder: LedgerDto = await this.cscApi.getLedger({
                        ledgerVersion: iterator, includeTransactions: true, includeAllData: true, includeState: true,
                    });
                    const transactionCount = LedgerFinder.transactions ? LedgerFinder.transactions.length : 0;

                    if (LedgerFinder) { await this.savedLedger({ status: 'OK', ledgerVersion: iterator, transactionCount, ...LedgerFinder }); }

                    iterator++;
                } catch (error) {
                    ledgerVersionNotFound.push(iterator);
                    console.log(error.message + ' Nº:' + iterator);
                    await this.savedLedger({ status: 'Missing', ledgerVersion: iterator });
                    iterator++;
                }
            }
            console.log('ledgerVersionNotFound', ledgerVersionNotFound);
        }).catch((err) => {
            console.log('Error in connected in CasinoCoin Server' + err);
        });
    }

    // get last ledgerVersion from database
    private getLastLedger = async () => {
        try {
            const sequenceSource: any = await this.LedgerRepository
                .createQueryBuilder('A')
                .select('MAX(A.ledgerVersion)', 'max')
                .getRawOne();
            return sequenceSource.max;
        } catch (err) {
            console.log('Error get lastLedgerVersion on DataBase');
        }
    }

    // save Ledger In BigQuery
     async savedLedger(ledger: any) {
        delete ledger.transactions;
        delete ledger.rawTransactions;
        delete ledger.rawState;
        await this.LedgerRepository.save(ledger);
        console.log('insert Ledger' + ledger.ledgerVersion);
    }
}
