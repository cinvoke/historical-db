import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Transactions } from '../entity/transaction.entity';
import { LedgerDto } from '../../ledgers/dto/ledgerDTO';
import { TransactionModifiedDTO } from '../dto/transactionModifiedDTO';
import { InfoAccountDTO } from '../../sync-process/class/dto/infoAccountDTO';
import { AccVersionService } from '../../account-version/services/acc-version.service';
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
      WHERE "accountId" = '${account}'
    `);
  }

  async findTxSendToMe(account) {
    return await this.transactionRepository.query(`
      SELECT *
      FROM transactions
      WHERE specification -> 'destination' ->> 'address' = '${account}'
    `);
  }

  async getLimitedTransactionsByAccount(body) {
    const { skip, take, account } = body;
    return await this.transactionRepository.createQueryBuilder('transactions')
      .where('transactions.accountId = :account', { account })
      .skip(skip) // number of tx to skip first
      .take(take) // take number tx
      .getMany();
  }

  // ----------------------------------SyncProcess-----------------------------------------

  public async initSyncTransactions(cscApi: any) {
    this.logger.debug('### Process Synchronize Transactions');
    try {
      // Get Last Ledger From CasinoCoin
      const lastLedgerCSC = await cscApi.getLedgerVersion();
      // Get Last Ledger From DataBase
      const lastLegerDBTransactions = await this.getLastLegerTransactions();
      this.logger.debug(`### Process Synchronize Transactions ==> lastLegerDB: ${lastLegerDBTransactions}, lastLedgerCSC: ${lastLedgerCSC}`);

      return this.initSync(lastLedgerCSC, cscApi);

    } catch (error) {
        return this.logger.debug('### Process Synchronize Transactions ==> Error: ' + error.message);
    }
  }

  public async initSync(lastLegerVersionAccounts, cscApi) {
    let iterator = lastLegerVersionAccounts;
    while (iterator !== 0) {
      try {
        const findTransaction = await this.transactionRepository.findOne({ ledgerVersion: iterator });
        if (!findTransaction) {
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
        } else {
          console.log('Ledger transaction of ledger already exits  Nº:' + iterator);
        }
        iterator--;
      } catch (error) {
        this.logger.debug(' ###  Error Transaction not Found' + ' Nº:' + iterator);
        iterator--;
      }
    }
    return this.logger.debug('### Process Synchronize Transactions ==> sync finished');
    // this.syncService.synchNotifier.next(false);
  }

  public async processTx(LedgerFinder: LedgerDto, cscApi) {
    let transaction: any;
    for await (transaction of LedgerFinder.transactions) {
      this.logger.debug(` ###  ---------------------ledger-${LedgerFinder.ledgerVersion}------------------------` );
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
        this.logger.debug(' ###  transaction type SetCRNRound ledger:' + LedgerFinder.ledgerVersion);
        // sync VersionAccount
        await this.modifiedTransaction(transactionModified, cscApi);
      }

      if (transaction.type === 'kycSet') { // OK
        this.logger.debug(' ###  transaction type KYCSet ledger:' + LedgerFinder.ledgerVersion);
        // sync VersionAccount
        await this.modifiedTransaction(transactionModified, cscApi);
      }

      if (transaction.type === 'trustline') { // OK
        this.logger.debug(' ###  transaction type trustline ledger:' + LedgerFinder.ledgerVersion);
        // sync VersionAccount
        await this.modifiedTransaction(transactionModified, cscApi);
      }

      if (transaction.type === 'AccountSet') {
        this.logger.debug(' ###  transaction type AccountSet ledger:' + LedgerFinder.ledgerVersion);
        // sync VersionAccount
        this.setAccountTransaction(transaction);
      }

      if (transaction.type === 'feeUpdate') { // OK
        this.logger.debug(' ###  transaction type AccountSet ledger:' + LedgerFinder.ledgerVersion);
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
        this.logger.debug(' ###  Error getting lastLedgerVersion from Database: ' + JSON.stringify(err));
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
        this.logger.debug(` ###  Error getting balance info for account: ${accountId}`, error);
      }
    }
  }

  async setAccountTransaction(transaction) { }
}
