import { SyncAccount } from '../syncAccounts';
import { TransactionModifiedDTO } from '../../../transactions/dto/transactionModifiedDTO';
import { getRepository } from 'typeorm';
import { Accounts } from '../../../accounts/entity/account.entity';
import { InfoAccountDTO } from '../dto/infoAccountDTO';

const syncAccount = new SyncAccount();

export const kycTransaction = async (transaction: TransactionModifiedDTO, cscAPI) => {
    const AccountRepository = getRepository(Accounts);
    const ledger = transaction.ledgerVersion;
    const elements = {
        sequence: transaction.sequence,
        ledger: transaction.ledgerVersion,
        id: transaction.id,
        ledgerHash: transaction.ledgerHash,
        ledgerTimestamp: transaction.ledgerTimestamp,
        parent: null,
        kyc: transaction.specification.KYC ? transaction.specification.KYC : null,
    };

    // tslint:disable-next-line:forin
    for (const accountId in transaction.outcome.balanceChanges) {
        try {
            const accountFindDB = await AccountRepository.findOne({ accountId });
            const getBalancesLastLedger = await cscAPI.getBalances(accountId);
            const getInfoLastLedger: InfoAccountDTO = await cscAPI.getAccountInfo(accountId);

            const getInfoAccount: InfoAccountDTO = await cscAPI.getAccountInfo(accountId, { ledgerVersion : ledger });
            // console.log(`getInfo: ${account}`, getInfoAccount);
            const getBalancesAccount = await cscAPI.getBalances(accountId, { ledgerVersion: ledger });
            // console.log(`getBalances: ${account}`, getBalancesAccount);

            if (accountFindDB) {
                if (ledger > accountFindDB.ledgerVersion) {
                    // Update Account
                    await syncAccount.updateAccount(accountFindDB, getBalancesLastLedger, getInfoLastLedger, elements);
                }
            } else {
                await syncAccount.insertAccount(accountId, getBalancesLastLedger, getInfoLastLedger, elements);
            }
            await syncAccount.insertNewAccountVersion(accountId, getBalancesAccount, getInfoAccount, elements);

        } catch (error) {
            console.log(`Error get info or balance account: ${accountId}`);
        }
    }

};
