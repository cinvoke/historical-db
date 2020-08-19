import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SyncLedger } from '../class/syncLedgers';
import { Subject } from 'rxjs';
import { TransactionsService } from '../../transactions/services/transactions.service';
import * as config from 'yaml-config';
import { AccountsService } from '../../accounts/services/accounts.service';
import { LedgerDto } from '../../ledgers/dto/ledgerDTO';
import { LedgersService } from '../../ledgers/services/ledgers.service';
import { CasinocoinService } from '../../casinocoin/casinocoin.service';
const settings = config.readConfig('config.yml');

@Injectable()
export class SyncService {

  public synchNotifier: Subject<boolean> = new Subject<boolean>();
  public stateSync = false;
  private readonly logger = new Logger(SyncService.name);
  public ledgerActually: number;
  
  constructor(
    private casinocoinService: CasinocoinService,
    private readonly transactionsService: TransactionsService,
    private readonly accountsService: AccountsService,
    private readonly ledgersService: LedgersService,
  ) {
    this.logger.debug('### Init SyncGlobalService');

    this.casinocoinService.serverConnectedSubject.subscribe( connected => {
      if (connected) {
        // listen for new Ledgers
        this.casinocoinService.cscAPI.on('ledger', ledger => {
          this.logger.debug('### CSC Ledger: ' + ledger.ledgerVersion);
          this.listenLedger(ledger.ledgerVersion);
        });
        // init Process Synchronize
        // sync Ledgers
        this.ledgersService.initSyncLedger(this.casinocoinService.cscAPI);
        // sync transactions
        this.transactionsService.initSyncTransactions(this.casinocoinService.cscAPI);
        // sync raw Accounts
        this.accountsService.initSyncAccounts();
      }
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
    // saved ledger
    const LedgerFinder: LedgerDto = await this.casinocoinService.cscAPI.getLedger({
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
      await this.transactionsService.processTx(LedgerFinder, this.casinocoinService.cscAPI);
      // saved Accounts
      for await (const transaction of LedgerFinder.transactions) {
        await this.accountsService.saveAccountsListenLedger(transaction, LedgerFinder,  this.casinocoinService.cscAPI);
      }
    }
  }

}
