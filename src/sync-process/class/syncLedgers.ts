import { Ledgers} from '../../ledgers/entity/ledger.entity';
import { getRepository } from 'typeorm';
import { LedgerDto } from '../../ledgers/dto/ledgerDTO';
import { Logger } from '@nestjs/common';
import { CasinocoinService } from '../../casinocoin/casinocoin.service';

export class SyncLedger {

    private LedgerRepository = getRepository(Ledgers);
    private actualLeger;
    private readonly logger = new Logger(SyncLedger.name);
    private initRunning: boolean;

    constructor( private casinocoinService: CasinocoinService) {
        this.initRunning = false;
        this.initSyncLedger();
    }

    private async initSyncLedger() {
        this.logger.debug('### Process Synchronize Ledger');
        try {
            // Get Last Ledger From DataBase
            const LastLedgerDB = await this.getLastLedger();
            // new instance From CasinoCoin
            await this.casinocoinService.cscAPI.connect();
            // Get Last Ledger From CasinoCoin
            this.actualLeger = await this.casinocoinService.cscAPI.getLedgerVersion();
            this.logger.debug(`### Process Synchronize Ledger ==> LastLedgerDB : ${ LastLedgerDB} - actualLegerCSC: ${ this.actualLeger}`);

            // compare Last Ledger with leger actually and init Sync in Database
            if (!LastLedgerDB) { this.initSync(1, this.actualLeger); }

            if ( LastLedgerDB >= 1 && LastLedgerDB < this.actualLeger) { this.initSync( LastLedgerDB + 1, this.actualLeger); }

            if (LastLedgerDB > this.actualLeger) {
                return this.logger.debug('### Process Synchronize Ledger ==> Database Is Actualized');
            }
        } catch (error) {
            return this.logger.debug('### Process Synchronize Ledger ==> Error: ' + error.message);
        }
    }

    private initSync( initLedgerVersion: number, LastLegerVersion: number) {
        let iterator: number = initLedgerVersion;
        const ledgerVersionNotFound: number[] = [];
        this.casinocoinService.serverConnectedSubject.subscribe( async connected => {
            if (connected && !this.initRunning) {
                this.initRunning = true;
                while (iterator < LastLegerVersion) {
                    // console.log('iterator', iterator, 'LastLegerVersion', LastLegerVersion);
                    try {
                        const LedgerFinder: LedgerDto = await this.casinocoinService.cscAPI.getLedger({
                            ledgerVersion: iterator, includeTransactions: true, includeAllData: true, includeState: true,
                        });
                        const transactionCount = LedgerFinder.transactions ? LedgerFinder.transactions.length : 0;
                        if (LedgerFinder) { await this.savedLedger({ status: 'OK', ledgerVersion: iterator, transactionCount, ...LedgerFinder }); }
                        iterator++;
                    } catch (error) {
                        ledgerVersionNotFound.push(iterator);
                        console.log('Ledger not found Nº:' + iterator + error.message);
                        await this.savedLedger({ status: 'Missing', ledgerVersion: iterator });
                        iterator++;
                    }
                }
                this.initRunning = false;
            }
            console.log('ledgerVersionNotFound', ledgerVersionNotFound);
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
            return null;
        }
    }

    // save Ledger In BigQuery
     async savedLedger(ledger: any) {
        delete ledger.transactions;
        delete ledger.rawTransactions;
        delete ledger.rawState;
        ledger.ledgerTimestamp = ledger.closeTime;
        await this.LedgerRepository.save(ledger);
        // console.log('insert Ledger' + ledger.ledgerVersion);
    }
}
