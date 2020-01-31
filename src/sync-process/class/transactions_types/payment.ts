import { SyncAccount } from '../syncAccounts';
import { TransactionModifiedDTO } from '../../../transactions/dto/transactionModifiedDTO';
import { BalanceDto } from '../../../transactions/dto/balanceDTO';
import { InfoAccountDTO } from '../dto/infoAccountDTO';
import { getRepository } from 'typeorm';
import { Accounts } from '../../../accounts/entity/account.entity';
import { AccountVersions } from '../../../account-version/entity/accountVersion.entity';

const syncAccount = new SyncAccount();

export const paymentTransaction = async (transaction: TransactionModifiedDTO, cscAPI) => {

    const AccountRepository = getRepository(Accounts);

    const ledger = transaction.ledgerVersion;
    const elements = {
        ledger: transaction.ledgerVersion,
        id: transaction.id,
        ledgerHash: transaction.ledgerHash,
        ledgerTimestamp: transaction.ledgerTimestamp,
        parent: transaction.specification.source.address,
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
            console.log(`Error get info or balance account: ${account}`);
        }
    }
};
