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
        parent: transaction.specification.source.address,
    };

    // tslint:disable-next-line:forin
    for (const accountId in transaction.outcome.balanceChanges) {
        try {
            // Find account in DB
            const accountFindDB = await AccountRepository.findOne({ accountId });

            const getBalancesLastLedgerAccount = await cscAPI.getBalances(accountId);
            const getInfoLastLedgerAccount: InfoAccountDTO = await cscAPI.getAccountInfo(accountId);
            const kycVersionFinal = getInfoLastLedgerAccount.kycVerified;

            const getInfoAccount: InfoAccountDTO = await cscAPI.getAccountInfo(accountId, { ledgerVersion: ledger });
            const kycVersionLedger = getInfoAccount.kycVerified;
            const getBalancesAccount = await cscAPI.getBalances(accountId, { ledgerVersion: ledger });

            if (accountFindDB) {
                if (ledger >= accountFindDB.ledgerVersion) {
                    // Update Account
                    await syncAccount.updateAccount(accountFindDB, getBalancesLastLedgerAccount, getInfoLastLedgerAccount, elements, kycVersionFinal);
                }
            } else {
                await syncAccount.insertAccount(accountId, getBalancesLastLedgerAccount, getInfoLastLedgerAccount, elements, kycVersionFinal);
            }
            await syncAccount.insertNewAccountVersion(accountId, getBalancesAccount, getInfoAccount, elements, kycVersionLedger);

        } catch (error) {
            console.log(`Error get info or balance account: ${accountId}`, error);
        }
    }
};
