import { setAccountTransaction } from './transactions_types/accountSet';
import { trustTransaction } from './transactions_types/trustSet';
import { kycTransaction } from './transactions_types/kycSet';
import { crnTransaction } from './transactions_types/SetCRNRound';
import { getRepository } from 'typeorm';
import { Transactions } from '../../transactions/entity/transaction.entity';
import { TransactionDTO } from '../../transactions/dto/transactionDTO';
import { LedgerDto } from '../../ledgers/dto/ledgerDTO';

import { CasinocoinAPI } from '@casinocoin/libjs';
import * as config from 'yaml-config';
import { TransactionModifiedDTO } from '../../transactions/dto/transactionModifiedDTO';
import { paymentTransaction } from './transactions_types/payment';
import { Accounts } from '../../accounts/entity/account.entity';
const settings = config.readConfig('config.yml');
export class SyncTransactions {

    private cscApi: CasinocoinAPI = new CasinocoinAPI({ server: settings.casinocoinServer });
    private TransactionsRepository = getRepository(Transactions);
    private AccountsRepository = getRepository(Accounts);

    constructor(lastLedgerVersionCSC: number) {
        this.initSyncTransactions(lastLedgerVersionCSC);
    }

    private async initSyncTransactions(lastLedgerVersionCSC) {
        try {
            // Get Last Ledger From DataBase
            const lastLegerVersionAccounts = await this.getLastLedgerAccounts();
            // compare Last Ledger with leger actually and init Sync in Database
            if (!lastLegerVersionAccounts) { this.initSync(1, lastLedgerVersionCSC); }

            if (lastLegerVersionAccounts >= 1 && lastLegerVersionAccounts < lastLedgerVersionCSC) {
                this.initSync(lastLegerVersionAccounts + 1, lastLedgerVersionCSC);
            }

            if (lastLegerVersionAccounts > lastLedgerVersionCSC) { return console.log('Database Is Actualized'); }
        } catch (error) {
            return console.log('Error initSyncLedger:', error.message);
        }
    }

    private async initSync(lastLegerVersionAccounts, lastLedgerVersionCSC ) {
        let iterator = lastLegerVersionAccounts;
        console.log('lastLegerVersionAccounts', iterator, 'lastLedgerVersionCSC', lastLedgerVersionCSC);
        this.cscApi.connect().then(async () => {
            while (iterator < lastLedgerVersionCSC) {
                try {
                    const LedgerFinder: LedgerDto = await this.cscApi.getLedger({
                        ledgerVersion: iterator, includeTransactions: true, includeAllData: true, includeState: true,
                    });
                    if (LedgerFinder.transactions) {
                        // loop for every transactionCheck
                        let transaction: any;
                        for await (transaction of LedgerFinder.transactions) {
                            console.log(`---------------------ledger-${iterator}------------------------` );
                            // send tx modified for add accounts
                            if (transaction.type === 'payment') {
                               // modified ledger Transactions for saved in DB
                                const transactionModified: TransactionModifiedDTO = this.transactionsModified(LedgerFinder);
                                // sync accounts
                                await paymentTransaction(transactionModified, this.cscApi);
                                // Insert the transaction
                                await this.TransactionsRepository.insert(transactionModified);
                            }
                            if (transaction.type === 'SetCRNRound') {
                                console.log('transaction type SetCRNRound ledger:' + iterator);
                                crnTransaction(transaction);
                            }
                            if (transaction.type === 'KYCSet') {
                                console.log('transaction type KYCSet ledger:' + iterator);
                                kycTransaction(transaction);
                            }
                            if (transaction.type === 'TrustSet') {
                                console.log('transaction type TrustSet ledger:' + iterator);
                                trustTransaction(transaction);
                            }
                            if (transaction.type === 'AccountSet') {
                                console.log('transaction type AccountSet ledger:' + iterator);
                                setAccountTransaction(transaction);
                            }

                            if (transaction.type === 'feeUpdate') {
                                console.log('transaction type AccountSet ledger:' + iterator);
                                setAccountTransaction(transaction);
                                await this.TransactionsRepository.insert({
                                    ...transaction,
                                    ledgerHash: LedgerFinder.ledgerHash,
                                    ledgerVersion: LedgerFinder.ledgerVersion,
                                    ledgerTimestamp: LedgerFinder.closeTime,
                                });
                            }
                        }
                    }
                    iterator++;
                } catch (error) {
                    console.log('Error in initSync', error.message + ' Nº:' + iterator, error);
                    iterator++;
                }
            }

        }).catch((err) => {
            console.log('Error in connected in CasinoCoin Server' + err);
        });
    }

    private transactionsModified(LedgerFinder: LedgerDto): any {

        const transactionSaned = LedgerFinder.transactions.filter( (item: TransactionDTO) => item.type === 'payment');
        const transactionsCheck: TransactionDTO[] = transactionSaned.map((element: TransactionDTO) => {
            if (element.type === 'payment') {
                const balanceChanges: Array<{ account, value, currency }> = [];
                const countOutcome = Object.keys(element.outcome.balanceChanges).length;
                const sourceAccount = element.specification.source.address;
                const destinationAccount = element.specification.destination.address;

                if (countOutcome >= 3) {
                    // Filter accounts for process your balances
                    const filterAccount = account => account === sourceAccount || account === destinationAccount;
                    const balanceCh = Object.getOwnPropertyNames(element.outcome.balanceChanges)
                        .filter(filterAccount)
                        .map((account) => {
                            return element.outcome.balanceChanges[account].forEach((item) => {
                                balanceChanges.push({
                                    account,
                                    value: item.value,
                                    currency: item.currency,
                                });
                            });
                        });

                    element.outcome.balanceChanges = balanceChanges;
                    element.outcome.orderbookChanges = '';
                    return {
                        ledgerHash: LedgerFinder.ledgerHash,
                        ledgerVersion: LedgerFinder.ledgerVersion,
                        ledgerTimestamp: LedgerFinder.closeTime,
                        ...element,
                    };
                } else {
                    Object.getOwnPropertyNames(element.outcome.balanceChanges).forEach((val, idx, array) => {
                        balanceChanges.push({
                            account: val,
                            currency: element.outcome.balanceChanges[val][0].currency,
                            value: element.outcome.balanceChanges[val][0].value,
                        });
                    });
                    element.outcome.balanceChanges = balanceChanges;
                    element.outcome.orderbookChanges = '';
                    return {
                        ledgerHash: LedgerFinder.ledgerHash,
                        ledgerVersion: LedgerFinder.ledgerVersion,
                        ledgerTimestamp: LedgerFinder.closeTime,
                        ...element,
                    };
                }

            }
        });
        return transactionsCheck;
    }

    // get last ledgerVersion from database
    private getLastLedgerAccounts = async () => {
        try {
            const sequenceSource: any = await this.AccountsRepository
                .createQueryBuilder('A')
                .select('MAX(A.ledgerVersion)', 'max')
                .getRawOne();
            return sequenceSource.max;
        } catch (err) {
            console.log('Error get lastLedgerVersion on DataBase');
            return null;
        }
    }

}
