import { SyncAccount } from '../syncAccounts';
import { TransactionModifiedDTO } from '../../../transactions/dto/transactionModifiedDTO';
import { getRepository } from 'typeorm';
import { Accounts } from '../../../accounts/entity/account.entity';
import { InfoAccountDTO } from '../dto/infoAccountDTO';

const syncAccount = new SyncAccount();

export const crnTransaction = async (transaction: TransactionModifiedDTO, cscAPI) => {
    console.log('ledgerVersion', transaction.ledgerVersion);
    const AccountRepository = getRepository(Accounts);
    const ledger = transaction.ledgerVersion;
    const elements = {
        ledger: transaction.ledgerVersion,
        id: transaction.id,
        ledgerHash: transaction.ledgerHash,
        ledgerTimestamp: transaction.ledgerTimestamp,
        parent: null,
        kyc: null,
    };

    // tslint:disable-next-line:forin
    for (const account in transaction.outcome.balanceChanges) {
        try {
            const accountFindDB = await AccountRepository.findOne({ account });
            const getBalancesLastLedger = await cscAPI.getBalances(account);
            const getInfoLastLedger: InfoAccountDTO = await cscAPI.getAccountInfo(account);

            const getInfoAccount: InfoAccountDTO = await cscAPI.getAccountInfo(account, { ledgerVersion : ledger });
            // console.log(`getInfo: ${account}`, getInfoAccount);
            const getBalancesAccount = await cscAPI.getBalances(account, { ledgerVersion: ledger });
            // console.log(`getBalances: ${account}`, getBalancesAccount);

            if (accountFindDB) {
                if (ledger > accountFindDB.ledgerVersion) {
                    // Update Account
                    await syncAccount.updateAccount(accountFindDB, getBalancesLastLedger, getInfoLastLedger, elements);
                }
            } else {
                await syncAccount.insertAccount(account, getBalancesLastLedger, getInfoLastLedger, elements);
            }
            await syncAccount.insertNewAccountVersion(account, getBalancesAccount, getInfoAccount, elements);

        } catch (error) {
            console.log(`Error get info or balance account: ${account}`, error);
        }
    }

};
