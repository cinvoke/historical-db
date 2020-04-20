import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SyncLedger } from '../class/syncLedgers';
import { Subject } from 'rxjs';
import { TransactionsService } from '../../transactions/services/transactions.service';
import * as config from 'yaml-config';
import { CasinocoinAPI } from '@casinocoin/libjs';
import { AccountsService } from '../../accounts/services/accounts.service';
import { LedgerDto } from '../../ledgers/dto/ledgerDTO';
import { LedgersService } from '../../ledgers/services/ledgers.service';
import { TransactionModifiedDTO } from '../../transactions/dto/transactionModifiedDTO';
const settings = config.readConfig('config.yml');
@Injectable()
export class SyncService {

  public synchNotifier: Subject<boolean> = new Subject<boolean>();
  public stateSync = false;
  private readonly logger = new Logger(SyncService.name);
  public ledgerActually: number;
  private cscApi: CasinocoinAPI = new CasinocoinAPI({ server: settings.casinocoinServer });

  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly accountsService: AccountsService,
    private readonly ledgersService: LedgersService,
  ) {
    this.logger.debug('### Init SyncGlobalService');
    // connect width casinocoin
    this.cscApi.connect().then(() => {
      // listen new Ledger
      this.cscApi.on('ledger', ledger => {
        this.logger.debug('### CSC Ledger' + JSON.stringify(ledger, null, 2));
        this.listenLedger(ledger.ledgerVersion);
      });
      // init Process Synchronize
      this.ledgersService.initSyncLedger(this.cscApi);
      this.transactionsService.initSyncTransactions(this.cscApi);
      this.accountsService.initSyncAccounts();
    });

    this.synchNotifier.subscribe((val: boolean) => {
      console.log(val);
      this.stateSync = val;
      this.logger.debug('### State Synchronize ==> change state' + this.stateSync);
    });
  }

  @Cron('0 */15 * * * *')
  handleCron() {
    this.logger.debug('###------HANDLE CRONJOB------####');
    if (!this.stateSync) {
      this.logger.debug('### Init process Synchronize with Cronjob');
      // this.execSync();
    }
  }

  async listenLedger(ledgerVersion) {
    console.log(ledgerVersion);

    // saved ledger
    const LedgerFinder: LedgerDto = await this.cscApi.getLedger({
      ledgerVersion,
      includeTransactions: true,
      includeAllData: true,
      includeState: true,
    });
    const transactionCount = LedgerFinder.transactions ? LedgerFinder.transactions.length : 0;
    if (LedgerFinder) {
      await this.ledgersService.savedLedger({ status: 'OK', ledgerVersion, transactionCount, ...LedgerFinder });
    }

    // saved transaction
    if (LedgerFinder.transactions) {
      await this.transactionsService.processTx(LedgerFinder, this.cscApi);
    }

    // saved Accounts
    for await (const transaction of LedgerFinder.transactions) {
      await this.accountsService.saveAccountsListenLedger(transaction, LedgerFinder,  this.cscApi);
    }
  }

}
