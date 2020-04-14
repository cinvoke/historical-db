import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CasinocoinAPI } from '@casinocoin/libjs';
import * as config from 'yaml-config';
import { SyncLedger } from '../../class/syncLedgers';
import { Subject } from 'rxjs';
import { CasinocoinService } from '../../../casinocoin/casinocoin.service';
import { SyncTransactionsService } from '../../class/syncTransaction.service';
const settings = config.readConfig('config.yml');
@Injectable()
export class SyncService {

  public synchNotifier: Subject<boolean> = new Subject<boolean>();
  public stateSync = false;
  private readonly logger = new Logger(SyncService.name);
  public ledgerActually: number;

  constructor(
    private casinocoinService: CasinocoinService,
    private syncTransactionsService: SyncTransactionsService,
  ) {
    this.synchNotifier.subscribe((val: boolean) => {
      this.stateSync = val;
      console.log(val);
    });
    if (!this.stateSync) {
      this.logger.debug('### Init process Synchronize 1');
      this.execSync();
      this.stateSync = true;
    }
  }

  @Cron('*/10 * * * * *')
  handleCron() {
    this.logger.debug('###------HANDLE CRONJOB------####');
    if (!this.stateSync) {
      this.logger.debug('### Init process Synchronize 2');
      this.execSync();
    }
  }

  async execSync() {
    // get Ledger Actually
      this.ledgerActually = await this.casinocoinService.getLedgerActually();
      // tslint:disable-next-line:no-unused-expression
      new SyncLedger(this.ledgerActually);
      // tslint:disable-next-line:no-unused-expression
      this.syncTransactionsService.initSyncTransactions();
  }

}
