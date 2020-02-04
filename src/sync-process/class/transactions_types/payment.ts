import { SyncAccount } from '../syncAccounts';
import { TransactionModifiedDTO } from '../../../transactions/dto/transactionModifiedDTO';
import { BalanceDto } from '../../../transactions/dto/balanceDTO';
import { InfoAccountDTO } from '../dto/infoAccountDTO';
import { getRepository } from 'typeorm';
import { Accounts } from '../../../accounts/entity/account.entity';

const syncAccount = new SyncAccount();

export const paymentTransaction = async (transaction: TransactionModifiedDTO, cscAPI) => {

    const AccountRepository = getRepository(Accounts);

    const ledger = transaction.ledgerVersion;
    const elements = {
        sequence: transaction.sequence,
        ledger: transaction.ledgerVersion,
        id: transaction.id,
        ledgerHash: transaction.ledgerHash,
        ledgerTimestamp: transaction.ledgerTimestamp,
        parent: transaction.specification.source.accountId,
        kyc: transaction.specification.KYC ? transaction.specification.KYC : null,
    };

    // tslint:disable-next-line:forin
    for (const accountId in transaction.outcome.balanceChanges) {
        try {
            const accountFindDB = await AccountRepository.findOne({ accountId });
            const getBalancesLastLedgerAccount = await cscAPI.getBalances(accountId);
            const getInfoLastLedgerAccount: InfoAccountDTO = await cscAPI.getAccountInfo(accountId);

            const getInfoAccount: InfoAccountDTO = await cscAPI.getAccountInfo(accountId, { ledgerVersion : ledger });
            // console.log(`getInfo: ${account}`, getInfoAccount);
            const getBalancesAccount = await cscAPI.getBalances(accountId, { ledgerVersion: ledger });
            // console.log(`getBalances: ${account}`, getBalancesAccount);

            if (accountFindDB) {
                if (ledger > accountFindDB.ledgerVersion) {
                    // Update Account
                    await syncAccount.updateAccount(accountFindDB, getBalancesLastLedgerAccount, getInfoLastLedgerAccount, elements);
                }
            } else {
                await syncAccount.insertAccount(accountId, getBalancesLastLedgerAccount, getInfoLastLedgerAccount, elements);
            }
            await syncAccount.insertNewAccountVersion(accountId, getBalancesAccount, getInfoAccount, elements);

        } catch (error) {
            console.log(`Error get info or balance account: ${accountId}`, error);
        }
    }
};
