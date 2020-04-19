import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SyncLedger } from '../class/syncLedgers';
import { Subject } from 'rxjs';
import { TransactionsService } from '../../transactions/services/transactions.service';
import * as config from 'yaml-config';
import { CasinocoinAPI } from '@casinocoin/libjs';
const settings = config.readConfig('config.yml');
@Injectable()
export class SyncService {

  public synchNotifier: Subject<boolean> = new Subject<boolean>();
  public stateSync = false;
  private readonly logger = new Logger(SyncService.name);
  public ledgerActually: number;
  private cscApi: CasinocoinAPI = new CasinocoinAPI({ server: settings.casinocoinServer });

  constructor(
    private readonly syncService: SyncService,
    private readonly transactionsService: TransactionsService,

  ) {
    this.cscApi.connect().then(() => {

      this.cscApi.on('ledger', ledger => {
        this.logger.debug('### CSC Ledger' + JSON.stringify(ledger, null, 2));
        this.listenLedger(ledger);
      });

    });

    this.logger.debug('### Init syncTransactionsService');
    this.synchNotifier.subscribe((val: boolean) => {
      console.log(val);
      this.stateSync = val;
      this.logger.debug('### State Synchronize ==> change state' + this.stateSync);
    });
    if (!this.stateSync) {
      this.logger.debug('### State Synchronize ==> In Process');
      this.execSync();
      this.stateSync = true;
    }
  }

  @Cron('0 */15 * * * *')
  handleCron() {
    this.logger.debug('###------HANDLE CRONJOB------####');
    if (!this.stateSync) {
      this.logger.debug('### Init process Synchronize with Cronjob');
      this.execSync();
    }
  }

  async execSync() {
    // tslint:disable-next-line:no-unused-expression
    // new SyncLedger();
    // tslint:disable-next-line:no-unused-expression
    // this.syncTransactionsService.initSyncTransactions();
  }

  listenLedger(ledger) {
    console.log(ledger);
  }

}
