import { TransactionModifiedDTO } from '../../../transactions/dto/transactionModifiedDTO';
import { BalanceDto } from '../../../transactions/dto/balanceDTO';
import { InfoAccountDTO } from '../dto/infoAccountDTO';
import { getRepository } from 'typeorm';
import { Accounts } from '../../../accounts/entity/account.entity';
import { AccountVersions } from '../../../account-version/entity/accountVersion.entiity';

export const paymentTransaction = async (transaction: TransactionModifiedDTO, cscAPI) => {
    const AccountRepository = getRepository(Accounts);
    const AccountVersionRepository = getRepository(AccountVersions);

    const ledger = transaction[0].ledgerVersion;
    const id = transaction[0].id;
    const ledgerHash = transaction[0].ledgerHash;
    const ledgerTimestamp = transaction[0].ledgerTimestamp;
    const parent = transaction[0].specification.source.address;

    let item: BalanceDto;
    for (item of transaction[0].outcome.balanceChanges) {
        console.log(ledger);
        try {
            const accountFindDB = await AccountRepository.findOne({ account: item.account });
            const getBalancesLastLedger = await cscAPI.getBalances(item.account);
            const getInfoLastLedger: InfoAccountDTO = await cscAPI.getAccountInfo(item.account);

            const getInfoAccount: InfoAccountDTO = await cscAPI.getAccountInfo(item.account, { ledgerVersion : ledger });
            // console.log(`getInfo: ${item.account}`, getInfoAccount);
            const getBalancesAccount = await cscAPI.getBalances(item.account, { ledgerVersion: ledger });
            // console.log(`getBalances: ${item.account}`, getBalancesAccount);

            if (accountFindDB) {
                if (ledger > accountFindDB.ledgerVersion) {
                    accountFindDB.balances = getBalancesLastLedger;
                    accountFindDB.ledgerHash = ledgerHash;
                    accountFindDB.sequence = getInfoLastLedger.sequence;
                    accountFindDB.ledgerVersion = ledger;
                    accountFindDB.ownerCount = getInfoLastLedger.ownerCount;
                    accountFindDB.previousAffectingTransactionID = getInfoLastLedger.previousAffectingTransactionID;
                    accountFindDB.previousAffectingTransactionLedgerVersion = getInfoLastLedger.previousAffectingTransactionLedgerVersion;
                    accountFindDB.previousInitiatedTransactionID = id;
                    accountFindDB.ledgerTimestamp = ledgerTimestamp;
                    // update account
                    await AccountRepository.save(accountFindDB);
                }
            } else {
                const newAccount = new Accounts();
                newAccount.account = item.account;
                newAccount.balances = getBalancesLastLedger;
                newAccount.sequence = getInfoLastLedger.sequence;
                newAccount.ledgerHash = ledgerHash;
                newAccount.ledgerVersion = ledger;
                newAccount.ownerCount = getInfoLastLedger.ownerCount;
                newAccount.previousAffectingTransactionID = getInfoLastLedger.previousAffectingTransactionID;
                newAccount.previousAffectingTransactionLedgerVersion = getInfoLastLedger.previousAffectingTransactionLedgerVersion;
                newAccount.previousInitiatedTransactionID = id;
                newAccount.ledgerTimestamp = ledgerTimestamp;
                newAccount.parent = parent;
                // insert new account
                await AccountRepository.insert(newAccount);
            }

            const newAccountVersion = new AccountVersions();
            newAccountVersion.account = item.account;
            newAccountVersion.balances = getBalancesAccount;
            newAccountVersion.ledgerHash = ledgerHash;
            newAccountVersion.ledgerVersion = ledger;
            newAccountVersion.ownerCount = getInfoAccount.ownerCount;
            newAccountVersion.previousAffectingTransactionID = getInfoAccount.previousAffectingTransactionID;
            newAccountVersion.previousAffectingTransactionLedgerVersion = getInfoAccount.previousAffectingTransactionLedgerVersion;
            newAccountVersion.previousInitiatedTransactionID = id;
            newAccountVersion.sequence = getInfoAccount.sequence;
            newAccountVersion.ledgerTimestamp = ledgerTimestamp;
            // insert new accountVersion
            await AccountVersionRepository.insert(newAccountVersion);

        } catch (error) {
            console.log(`Error get info or balance account: ${item.account}`);
        }
    }
};
