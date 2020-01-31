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
    const ledger = transaction[0].ledgerVersion;
    const elements = {
        ledger: transaction[0].ledgerVersion,
        id: transaction[0].id,
        ledgerHash: transaction[0].ledgerHash,
        ledgerTimestamp: transaction[0].ledgerTimestamp,
        parent: transaction[0].specification.source.address,
    };
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
                    // Update Account
                    await syncAccount.updateAccount(accountFindDB, getBalancesLastLedger, getInfoLastLedger, elements);
                }
            } else {
                await syncAccount.insertAccount(item.account, getBalancesLastLedger, getInfoLastLedger, elements);
            }
            await syncAccount.insertNewAccountVersion(item.account, getBalancesAccount, getInfoAccount, elements);

        } catch (error) {
            console.log(`Error get info or balance account: ${item.account}`);
        }
    }
};
