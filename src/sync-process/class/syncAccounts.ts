import { getRepository } from 'typeorm';
import { Accounts } from '../../accounts/entity/account.entity';
import { AccountVersions } from '../../account-version/entity/accountVersion.entity';
import { InfoAccountDTO } from './dto/infoAccountDTO';

export class SyncAccount {

    // tslint:disable-next-line:max-line-length
    public async updateAccount(accountFindDB: Accounts, getBalancesLastLedger, getInfoLastLedger: InfoAccountDTO, elements: { ledgerHash, ledger, id, ledgerTimestamp, parent}, kycVersionFinal) {
        const accountRepository = getRepository(Accounts);
        accountFindDB.balances = getBalancesLastLedger;
        accountFindDB.ledgerHash = elements.ledgerHash;
        accountFindDB.sequence = getInfoLastLedger.sequence;
        accountFindDB.ledgerVersion = elements.ledger;
        accountFindDB.ownerCount = getInfoLastLedger.ownerCount;
        accountFindDB.previousAffectingTransactionID = getInfoLastLedger.previousAffectingTransactionID;
        accountFindDB.previousAffectingTransactionLedgerVersion = getInfoLastLedger.previousAffectingTransactionLedgerVersion;
        accountFindDB.previousInitiatedTransactionID = elements.id;
        accountFindDB.ledgerTimestamp = elements.ledgerTimestamp;
        accountFindDB.kyc = kycVersionFinal;
        // update account
        await accountRepository.save(accountFindDB);
        console.log(`update account ${accountFindDB.accountId}`);
    }

    // tslint:disable-next-line:max-line-length
    public async insertAccount(account, getBalancesLastLedger,  getInfoLastLedger: InfoAccountDTO, elements: {ledgerHash, ledger, id, ledgerTimestamp, parent}, kycVersionFinal) {
        const accountRepository = getRepository(Accounts);
        const newAccount = new Accounts();
        newAccount.accountId = account;
        newAccount.balances = getBalancesLastLedger;
        newAccount.sequence = getInfoLastLedger.sequence;
        newAccount.ledgerHash = elements.ledgerHash;
        newAccount.ledgerVersion = elements.ledger;
        newAccount.ownerCount = getInfoLastLedger.ownerCount;
        newAccount.previousAffectingTransactionID = getInfoLastLedger.previousAffectingTransactionID;
        newAccount.previousAffectingTransactionLedgerVersion = getInfoLastLedger.previousAffectingTransactionLedgerVersion;
        newAccount.previousInitiatedTransactionID = elements.id;
        newAccount.ledgerTimestamp = elements.ledgerTimestamp;
        newAccount.kyc = kycVersionFinal;
        newAccount.parent = elements.parent;
        // insert new account
        await accountRepository.insert(newAccount);
        console.log(`insert account ${account}`);
    }

    // tslint:disable-next-line:max-line-length
    public async insertNewAccountVersion(account, getBalancesAccount,  getInfoAccount: InfoAccountDTO, elements: {ledgerHash, ledger, id, ledgerTimestamp, parent, sequence}, kycVersionLedger) {
        const accountVersionRepository = getRepository(AccountVersions);
        const newAccountVersion = new AccountVersions();
        newAccountVersion.accountId = account;
        newAccountVersion.balances = getBalancesAccount;
        newAccountVersion.ledgerHash = elements.ledgerHash;
        newAccountVersion.ledgerVersion = elements.ledger;
        newAccountVersion.ownerCount = getInfoAccount.ownerCount;
        newAccountVersion.previousAffectingTransactionID = getInfoAccount.previousAffectingTransactionID;
        newAccountVersion.previousAffectingTransactionLedgerVersion = getInfoAccount.previousAffectingTransactionLedgerVersion;
        newAccountVersion.previousInitiatedTransactionID = elements.id;
        newAccountVersion.sequence = elements.sequence;
        newAccountVersion.ledgerTimestamp = elements.ledgerTimestamp;
        newAccountVersion.kyc = kycVersionLedger;
        // insert new accountVersion
        await accountVersionRepository.insert(newAccountVersion);
        console.log(`insert VersionAccount ${account}`);
    }

}
