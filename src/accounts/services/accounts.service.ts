import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Accounts } from '../entity/account.entity';
import { CasinocoinAPI } from '@casinocoin/libjs';
import { InfoAccountDTO } from '../../sync-process/class/dto/infoAccountDTO';
import * as config from 'yaml-config';
import { LedgerDto } from '../../ledgers/dto/ledgerDTO';
const settings = config.readConfig('config.yml');

@Injectable()
export class AccountsService {

  private cscApi: CasinocoinAPI = new CasinocoinAPI({ server: settings.casinocoinServer });
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    @InjectRepository(Accounts)
    private readonly accountRepository: Repository<Accounts>,
  ) {}

  getAll(): Promise<Accounts[]> {
    return this.accountRepository.find();
  }

  getAccount(account: string): Promise<Accounts> {
    return this.accountRepository.findOne({ accountId: account });
  }

  async getTokens() {
    this.cscApi.connect().then((value) => {
      this.cscApi.getConfigInfo('Token').then(configResult => {
        console.log('configResult', configResult);
      });
    });
  }

  // --------------------------------SyncAccountService---------------------------------------
  public async initSyncAccounts() {
    this.logger.debug('### Process Synchronize Transactions');
    try {
      await this.cscApi.connect();
      // Get Last Ledger From CasinoCoin
      const lastLedgerVersionCSC = await this.cscApi.getLedgerVersion();
      // tslint:disable-next-line:max-line-length
      this.logger.debug(`### Process Synchronize Transactions ==>  ActualLegerCSC: ${lastLedgerVersionCSC}`);

      // get Full ledger
      const ledger = await this.cscApi.getLedger({
        ledgerVersion: lastLedgerVersionCSC,
        includeTransactions: true,
        includeAllData: true,
        includeState: true,
      });
      delete ledger.rawTransactions;

      // convert rawState for to get Accounts
      const rawState = JSON.parse(ledger.rawState);
      //  Accounts filter
      const accounts = rawState.map((obj) => {
        if (obj.Account) { return obj.Account; }
      }).filter(notUndefined => notUndefined !== undefined);
      console.log(accounts.length);

      for await (const account of accounts) {
        // save account
        await this.saveAccount(account, ledger, this.cscApi, null , null);
      }
      if (lastLedgerVersionCSC) {
        return this.logger.debug('### Process Synchronize Transactions ==> Finished');
      }
    } catch (error) {
      return this.logger.debug('### Process Synchronize Transactions ==> Error: ' + error.message);
    }
  }

  // save account from listener Leger
  public async  saveAccountsListenLedger(transaction, ledger: LedgerDto,  cscApi: CasinocoinAPI) {
    // tslint:disable-next-line:forin
    for (const accountId in transaction.outcome.balanceChanges) {
      try {
        await this.saveAccount(accountId, ledger, cscApi, transaction.id, null);
      } catch (error) {
        console.log(`Error saveAccountsListenLedger: ${accountId}`, error);
      }
    }
  }

  public async saveAccount(account, ledger, cscApi, txId, parent) {

    const getBalancesLastLedgerAccount = await cscApi.getBalances(account);
    const getInfoLastLedgerAccount: InfoAccountDTO = await cscApi.getAccountInfo(account);
    const kycVersionFinal = getInfoLastLedgerAccount.kycVerified;

    const addAccount = async () => {
      const newAccount = new Accounts();
      newAccount.accountId = account;
      newAccount.balances = getBalancesLastLedgerAccount;
      newAccount.sequence = getInfoLastLedgerAccount.sequence;
      newAccount.ledgerHash = ledger.ledgerHash;
      newAccount.ledgerVersion = ledger.ledgerVersion;
      newAccount.ownerCount = getInfoLastLedgerAccount.ownerCount;
      newAccount.previousAffectingTransactionID = getInfoLastLedgerAccount.previousAffectingTransactionID;
      newAccount.previousAffectingTransactionLedgerVersion = getInfoLastLedgerAccount.previousAffectingTransactionLedgerVersion;
      newAccount.previousInitiatedTransactionID = txId;
      newAccount.ledgerTimestamp = new Date(ledger.closeTime);
      newAccount.kyc = kycVersionFinal;
      newAccount.parent = parent;
      // insert new account
      await this.accountRepository.save(newAccount);
      console.log(`insert account ${account}`);
    };

    if (parent) { return await addAccount(); }
    if (!parent) {
      const findAccount = await this.accountRepository.findOne(account);
      // compare if ledger version of findAccount is greater
      if (findAccount && (ledger.ledgerVersion > findAccount.ledgerVersion  )) {
        findAccount.accountId = account;
        findAccount.balances = getBalancesLastLedgerAccount;
        findAccount.sequence = getInfoLastLedgerAccount.sequence;
        findAccount.ledgerHash = ledger.ledgerHash;
        findAccount.ledgerVersion = ledger.ledgerVersion;
        findAccount.ownerCount = getInfoLastLedgerAccount.ownerCount;
        findAccount.previousAffectingTransactionID = getInfoLastLedgerAccount.previousAffectingTransactionID;
        findAccount.previousAffectingTransactionLedgerVersion = getInfoLastLedgerAccount.previousAffectingTransactionLedgerVersion;
        findAccount.previousInitiatedTransactionID = txId;
        findAccount.ledgerTimestamp = new Date(ledger.closeTime);
        findAccount.kyc = kycVersionFinal;
        console.log(`update Account ${findAccount.accountId}`);
        return await this.accountRepository.save(findAccount);
      }
      if (!findAccount) { return await addAccount(); }
    }

  }
}
