import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ledgers } from '../entity/ledger.entity';
import { LedgerDto } from '../dto/ledgerDTO';
import { CasinocoinService } from '../../casinocoin/casinocoin.service';

@Injectable()
export class LedgersService {

  private readonly logger = new Logger(LedgersService.name);
  constructor(
    @InjectRepository(Ledgers)
    private readonly ledgerRepository: Repository<Ledgers>,
    private casinocoinService: CasinocoinService,
  ) { }

  getAll(): Promise<Ledgers[]> {
    return this.ledgerRepository.find();
  }

  // -----------------------Synch Ledger----------------------------------
  public async initSyncLedger(cscApi) {
    this.logger.debug('### Process Synchronize Ledger');
    try {
      // Get Last Ledger From DataBase
      const LastLedgerDB = await this.getLastLedger();
      // Get Last Ledger From CasinoCoin
      const actualLegerCSC = await cscApi.getLedgerVersion();

      this.logger.debug(`### Process Synchronize Ledger ==> LastLedgerDB: ${ LastLedgerDB} - actualLegerCSC: ${ actualLegerCSC}`);
      this.initSync(actualLegerCSC, cscApi);
      // LastLedgerDB ? this.initSync(LastLedgerDB - 1, cscApi) : this.initSync(actualLegerCSC, cscApi);

      // if (LastLedgerDB === 0) {
      //   return this.logger.debug('### Process Synchronize Ledger ==> Database Is Actualized');
      // }
    } catch (error) {
      return this.logger.debug('### Process Synchronize Ledger ==> Error: ' + error.message);
    }
  }

  private async initSync( initLedgerVersion: number, cscApi: any) {
    let iterator: number = initLedgerVersion;
    const ledgerVersionNotFound: number[] = [];

    while (iterator !== 0) {
      // console.log('iterator', iterator, 'LastLegerVersion', LastLegerVersion);
      try {
        // first find ledger in data base for know if make request to casinocoin
        const findLedger = await this.ledgerRepository.findOne({ ledgerVersion: iterator });
        if (!findLedger) {
          // get ledger from casinocoin
          const LedgerFinder: LedgerDto = await cscApi.getLedger({
            ledgerVersion: iterator,
            includeTransactions: true,
            includeAllData: true,
            includeState: true,
          });
          // count transactions
          const transactionCount = LedgerFinder.transactions ? LedgerFinder.transactions.length : 0;
          // 
          if (LedgerFinder) { await this.savedLedger({ status: 'OK', ledgerVersion: iterator, transactionCount, ...LedgerFinder }); }
        } else {
          console.log('Ledger already exits  Nº:' + iterator);
        }
        iterator--;
      } catch (error) {
        ledgerVersionNotFound.push(iterator);
        console.log('Ledger not found Nº:' + iterator + error.message);
        await this.savedLedger({ status: 'Missing', ledgerVersion: iterator });
        iterator--;
      }
    }
    console.log('ledgerVersionNotFound', ledgerVersionNotFound);
  }

  // get last ledgerVersion from database
  private getLastLedger = async () => {
    try {
      const sequenceSource: any = await this.ledgerRepository
        .createQueryBuilder('A')
        .select('MIN(A.ledgerVersion)', 'min')
        .getRawOne();
      return sequenceSource.min;
    } catch (err) {
      console.log('Error getting lastLedgerVersion from Database: ' + JSON.stringify(err));
      return null;
    }
  }

  // save Ledger In BigQuery
  async savedLedger(ledger: any) {
    delete ledger.transactions;
    delete ledger.rawTransactions;
    delete ledger.rawState;
    ledger.ledgerTimestamp = ledger.closeTime;
    await this.ledgerRepository.save(ledger);
    console.log('insert Ledger: ' + ledger.ledgerVersion);
  }
}
