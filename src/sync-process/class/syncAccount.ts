import { TransactionDTO } from '../../transactions/dto/transactionDTO';
import { getRepository } from 'typeorm';
import { Account } from '../../accounts/entity/account.entity';
import { TransactionModifiedDTO } from '../../transactions/dto/transactionModifiedDTO';
import { BalanceDto } from '../../transactions/dto/balanceDTO';
import { Transaction } from '../../transactions/entity/transaction.entity';

export class SyncAccount {

    private AccountRepository = getRepository(Account);
    private TransactionRepository = getRepository(Transaction);

    constructor(transaction: TransactionModifiedDTO , item: BalanceDto) {
        this.initSyncAccount(transaction, item);
    }

    async initSyncAccount(transaction: TransactionModifiedDTO, item: BalanceDto) {
        try {
            // count transaction
            const lengthBalanceChanges = transaction.outcome.balanceChanges.length;
            // get last balance of Account
            const account = await this.AccountRepository.findOne({ account: item.account });

            if (!account) {
                await this.insertNewAccount(transaction, item);
                console.log('save LastBalanceAccount', account);
            } else {
                await this.accountsBalances(transaction, item, lengthBalanceChanges, account);
            }
        } catch (error) {
            console.log('Error in fr transaction: ' + error);
        }
    }

    private async insertNewAccount(transaction: TransactionModifiedDTO, item: BalanceDto) {
        const newAccount: Account = new Account();
        newAccount.account = item.account;
        newAccount.sequence = transaction.sequence;
        newAccount.balances = [{currency : item.currency, value: parseFloat(item.value) }];
        newAccount.ledgerHash = transaction.ledgerHash;
        newAccount.ownerCount = 0;
        newAccount.previousAffectingTransactionID = transaction.id;
        newAccount.previousAffectingTransactionLedgerVersion = transaction.ledgerVersion;
        newAccount.previousInitiatedTransactionID = '';

        await this.AccountRepository.save(newAccount);
    }

    // tslint:disable-next-line:max-line-length
    private accountsBalances = async  (transaction: TransactionModifiedDTO, item: BalanceDto, lengthBalanceChanges: number, lastBalanceAccount: Account) => {
        let count: number = 0;
        // Function for compare the account sequences
        const compareAccountSequence = async () => {
            const account = item.account;
            const sequenceTx = transaction.sequence;

            try {
                // const sequenceAccount = await this.getSequence(account);
                const sequenceAccount = lastBalanceAccount.sequence;
                console.log('ActuallySequenceAccountTX:', sequenceTx, 'sequenceInPostgres :', sequenceAccount, 'account', account);
                const pass: boolean = sequenceTx === sequenceAccount + 1;
                const exists: boolean = sequenceTx < sequenceAccount || !sequenceAccount;
                const correctly: boolean = (sequenceTx === sequenceAccount && lengthBalanceChanges > 2) || pass;
                const wait: boolean = sequenceTx >= sequenceAccount + 2 && sequenceTx > sequenceAccount;

                if (correctly) {
                    // console.log('lastBalanceAccount', lastBalanceAccount);
                    lastBalanceAccount.sequence = sequenceTx;
                    const index = lastBalanceAccount.balances.findIndex(balance => balance.currency === item.currency);
                    // console.log('index', index);
                    if (index === -1) {
                        lastBalanceAccount.balances.push({ currency: item.currency, value: parseFloat(item.value) });
                    } else {
                        lastBalanceAccount.balances[index].value = lastBalanceAccount.balances[index].value + parseFloat(item.value);
                    }
                    await this.AccountRepository.save(lastBalanceAccount);
                    console.log('save Balance Account: ', lastBalanceAccount.account);
                    // console.log('save LastBalanceAccount', lastBalanceAccount.account);
                    // console.log('lastBalanceAccount: ===', lastBalanceAccount);
                }

                if (exists) {
                    console.log('exists tx for SourceAccount');
                }

                if (wait) {
                    count++;
                    if (count === 50) { return; }
                    setTimeout(compareAccountSequence, 3000);
                    console.log('Waiting Change source');
                }

            } catch (error) {
                return console.log('Error compare Sequence: ' + error);
            }
        };
        await compareAccountSequence();
    }

}
