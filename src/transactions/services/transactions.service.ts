import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Transactions } from '../entity/transaction.entity';
import { LedgerDto } from '../../ledgers/dto/ledgerDTO';
import { TransactionModifiedDTO } from '../dto/transactionModifiedDTO';
import { InfoAccountDTO } from '../../sync-process/class/dto/infoAccountDTO';
import { AccVersionService } from '../../account-version/services/acc-version.service';
import { CasinocoinAPI } from '@casinocoin/libjs';
import { Accounts } from '../../accounts/entity/account.entity';
import { AccountsService } from '../../accounts/services/accounts.service';

@Injectable()
export class TransactionsService {

  private readonly logger = new Logger(TransactionsService.name);
  constructor(
    @InjectRepository(Transactions)
    private readonly transactionRepository: Repository<Transactions>,
    @InjectRepository(Accounts)
    private readonly accountRepository: Repository<Accounts>,
    private readonly accVersionService: AccVersionService,
    private readonly accountsService: AccountsService,
  ) { }

  async getAll(): Promise<Transactions[]> {
    return await this.transactionRepository.find();
  }

  async getTransaction(ledgerHash) {
    console.log('ledgerHash', ledgerHash);
    const findTx = await this.transactionRepository.findOne({ledgerHash});
    console.log('findTx', findTx);
    return findTx;
  }

  // transaction
  async findTxMakeAccount(account) {
    return await this.transactionRepository.query(`
      SELECT *
      FROM transactions
      WHERE specification -> 'source' ->> 'address' = '${account}'
    `);
  }

  async findTxMeCount(account) {
    return await this.transactionRepository.query(`
      SELECT COUNT(*)
      FROM transactions
      WHERE specification -> 'source' ->> 'address' = '${account}'
    `);
  }

  async findTxSendToMe(account) {
    return await this.transactionRepository.query(`
      SELECT *
      FROM transactions
      WHERE specification -> 'destination' ->> 'address' = '${account}'
    `);
  }

  // async getLengthTransactions(account) {
  //   return await this.transactionRepository.createQueryBuilder('transactions')
  //   .select('SUM(transactions.accountId)', 'sum')
  //   .where('transactions.accountId = :accountId', { accountId: account })
  //   .getRawOne();
  //     // .select()
  //     // .where('transactions.accountId = :accountId', { accountId: account })
  //     // .c
  // }

  async getLimitedTransactionsByAccount(body) {
    const { skip, take, account } = body;
    console.log( { skip, take, account });
    return await this.transactionRepository.createQueryBuilder('transactions')
      .where('transactions.accountId = :accountId', { accountId: account })
      .skip(skip) // number of tx to skip first
      .take(take) // take number tx
      .getMany();
  }

  // ----------------------------------SyncProcess-----------------------------------------

  public async initSyncTransactions(cscApi: CasinocoinAPI) {
    this.logger.debug('### Process Synchronize Transactions');
    try {
      // Get Last Ledger From DataBase
      const lastLegerDBTransactions = await this.getLastLegerTransactions();
      let lastLedgerCSC;
      if (!lastLegerDBTransactions) {
        lastLedgerCSC = await cscApi.getLedgerVersion();
      }
      // Get Last Ledger From CasinoCoin
      this.logger.debug(`### Process Synchronize Transactions ==> lastLegerDB: ${ lastLegerDBTransactions}, lastLedgerCSC: ${lastLedgerCSC} `);

      // compare Last Ledger with leger actually and init Sync in Database
      if (lastLegerDBTransactions !== 0) {
        this.initSync(lastLegerDBTransactions ? lastLegerDBTransactions - 1 : lastLedgerCSC, cscApi);
        // this.syncService.synchNotifier.next(true);
      }

      if (lastLegerDBTransactions === 0) {
          return this.logger.debug('### Process Synchronize Transactions ==> Database Is Actualized');
      }
    } catch (error) {
        return this.logger.debug('### Process Synchronize Transactions ==> Error: ' + error.message);
    }
  }

  public async initSync(lastLegerVersionAccounts, cscApi) {
    let iterator = lastLegerVersionAccounts;
    while (iterator !== 0) {
      try {
        const LedgerFinder: LedgerDto = await cscApi.getLedger({
            ledgerVersion: iterator,
            includeTransactions: true,
            includeAllData: true,
            includeState: true,
        });

        if (LedgerFinder.transactions) {
          // loop for every transactionCheck
          await this.processTx(LedgerFinder, cscApi);
        }
        iterator--;
      } catch (error) {
        console.log('Error in initSync', error.message + ' Nº:' + iterator, error);
        iterator--;
      }
    }
    return this.logger.debug('### Process Synchronize Transactions ==> sync finished');
    // this.syncService.synchNotifier.next(false);
  }

  public async processTx(LedgerFinder: LedgerDto, cscApi) {
    let transaction: any;
    for await (transaction of LedgerFinder.transactions) {
      console.log(`---------------------ledger-${LedgerFinder.ledgerVersion}------------------------` );
      // Object Transaction Modified
      const transactionModified: TransactionModifiedDTO = {
        ledgerHash: LedgerFinder.ledgerHash,
        ledgerVersion: LedgerFinder.ledgerVersion,
        ledgerTimestamp: LedgerFinder.closeTime,
        accountId : transaction.address,
        ...transaction,
      };
      // Insert the transaction
      await this.transactionRepository.insert(transactionModified);

      // send tx modified for add accounts
      if (transaction.type === 'payment') { // OK
          // sync VersionAccount
          await this.modifiedTransaction(transactionModified, cscApi);
      }

      if (transaction.type === 'setCRNRound') { //
        console.log('transaction type SetCRNRound ledger:' + LedgerFinder.ledgerVersion);
        // sync VersionAccount
        await this.modifiedTransaction(transactionModified, cscApi);
      }

      if (transaction.type === 'kycSet') { // OK
        console.log('transaction type KYCSet ledger:' + LedgerFinder.ledgerVersion);
        // sync VersionAccount
        await this.modifiedTransaction(transactionModified, cscApi);
      }

      if (transaction.type === 'trustline') { // OK
        console.log('transaction type trustline ledger:' + LedgerFinder.ledgerVersion);
        // sync VersionAccount
        await this.modifiedTransaction(transactionModified, cscApi);
      }

      if (transaction.type === 'AccountSet') {
        console.log('transaction type AccountSet ledger:' + LedgerFinder.ledgerVersion);
        // sync VersionAccount
        this.setAccountTransaction(transaction);
      }

      if (transaction.type === 'feeUpdate') { // OK
        console.log('transaction type AccountSet ledger:' + LedgerFinder.ledgerVersion);
        this.setAccountTransaction(transaction);
      }
    }
  }

  // get last ledgerVersion from database
  private getLastLegerTransactions = async () => {
    try {
      const sequenceSource: any = await this.transactionRepository
          .createQueryBuilder('A')
          .select('MIN(A.ledgerVersion)', 'min')
          .getRawOne();
      return sequenceSource.min;
    } catch (err) {
        console.log('Error get lastLedgerVersion on DataBase');
        return null;
    }
  }

  async modifiedTransaction(transaction: TransactionModifiedDTO, cscApi) {
    const ledger = transaction.ledgerVersion;
    const elements = {
      sequence: transaction.sequence,
      ledger: transaction.ledgerVersion,
      id: transaction.id,
      ledgerHash: transaction.ledgerHash,
      ledgerTimestamp: transaction.ledgerTimestamp,
      parent: null,
    };

    // tslint:disable-next-line:forin
    for (const accountId in transaction.outcome.balanceChanges) {
      try {

        const getInfoAccount: InfoAccountDTO = await cscApi.getAccountInfo(accountId, { ledgerVersion: ledger });
        const kycVersionLedger = getInfoAccount.kycVerified;
        const getBalancesAccount = await cscApi.getBalances(accountId, { ledgerVersion: ledger });

        // if account sequence is equal to 1 the parent account is transaction account
        if (getInfoAccount.sequence === 1) {
          elements.parent = transaction.accountId;
          const findAccount = await this.accountRepository.findOne({ accountId });

          if (!findAccount) {
            const ledgerObj = {
              closeTime: elements.ledgerTimestamp,
              ledgerHash: elements.ledgerHash,
              ledgerVersion: elements.ledger,
            };
            this.logger.debug('### send Accout with parent' + accountId);
            await this.accountsService.saveAccount(accountId, ledgerObj, cscApi, transaction.id, transaction.accountId);
          }

          if (findAccount) {
            findAccount.parent = transaction.accountId;
            await this.accountRepository.save(findAccount);
          }
        }

        await this.accVersionService.insertNewAccountVersion(accountId, getBalancesAccount, getInfoAccount, elements, kycVersionLedger);

      } catch (error) {
        console.log(`Error get info or balance account: ${accountId}`, error);
      }
    }
  }

  async setAccountTransaction(transaction) { }
}
