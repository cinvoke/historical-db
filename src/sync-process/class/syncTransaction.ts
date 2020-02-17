import { setAccountTransaction } from './transactions_types/accountSet';
import { trustTransaction } from './transactions_types/trustSet';
import { kycTransaction } from './transactions_types/kycSet';
import { crnTransaction } from './transactions_types/SetCRNRound';
import { getRepository } from 'typeorm';
import { Transactions } from '../../transactions/entity/transaction.entity';
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

    private async initSync(lastLegerVersionAccounts, lastLedgerVersionCSC) {
        // this.syncService.subjectSync.next(true);
        let iterator = lastLegerVersionAccounts;
        console.log('lastLegerVersionAccounts', iterator, 'lastLedgerVersionCSC', lastLedgerVersionCSC);
        this.cscApi.connect().then(async () => {
            while (iterator <= lastLedgerVersionCSC) {
                try {
                    const LedgerFinder: LedgerDto = await this.cscApi.getLedger({
                        ledgerVersion: iterator,
                        includeTransactions: true,
                        includeAllData: true,
                        includeState: true,
                    });

                    if (LedgerFinder.transactions) {
                        // loop for every transactionCheck
                        let transaction: any;
                        for await (transaction of LedgerFinder.transactions) {
                            console.log(`---------------------ledger-${iterator}------------------------` );
                            // send tx modified for add accounts
                            if (transaction.type === 'payment') { // OK
                                const transactionModified: TransactionModifiedDTO = {
                                    ledgerHash: LedgerFinder.ledgerHash,
                                    ledgerVersion: LedgerFinder.ledgerVersion,
                                    ledgerTimestamp: LedgerFinder.closeTime,
                                    accountId : transaction.address,
                                    ...transaction,
                                };
                                // sync accounts
                                await paymentTransaction(transactionModified, this.cscApi);
                                // Insert the transaction
                                await this.TransactionsRepository.insert(transactionModified);
                            }

                            if (transaction.type === 'setCRNRound') { //
                                console.log('transaction type SetCRNRound ledger:' + iterator);
                                const transactionModified: TransactionModifiedDTO = {
                                    ledgerHash: LedgerFinder.ledgerHash,
                                    ledgerVersion: LedgerFinder.ledgerVersion,
                                    ledgerTimestamp: LedgerFinder.closeTime,
                                    accountId : transaction.address,
                                    ...transaction,
                                };
                                await crnTransaction(transactionModified, this.cscApi);
                                await this.TransactionsRepository.insert(transactionModified);
                            }

                            if (transaction.type === 'kycSet') { // OK
                                console.log('transaction type KYCSet ledger:' + iterator);
                                const transactionModified: TransactionModifiedDTO = {
                                    ledgerHash: LedgerFinder.ledgerHash,
                                    ledgerVersion: LedgerFinder.ledgerVersion,
                                    ledgerTimestamp: LedgerFinder.closeTime,
                                    accountId : transaction.address,
                                    ...transaction,
                                };
                                await kycTransaction(transactionModified, this.cscApi);
                                await this.TransactionsRepository.insert(transactionModified);
                            }

                            if (transaction.type === 'trustline') { // OK
                                console.log('transaction type trustline ledger:' + iterator);
                                const transactionModified: TransactionModifiedDTO = {
                                    ledgerHash: LedgerFinder.ledgerHash,
                                    ledgerVersion: LedgerFinder.ledgerVersion,
                                    ledgerTimestamp: LedgerFinder.closeTime,
                                    accountId : transaction.address,
                                    ...transaction,
                                };
                                await trustTransaction(transactionModified, this.cscApi);
                                await this.TransactionsRepository.insert(transactionModified);
                            }

                            if (transaction.type === 'AccountSet') {
                                console.log('transaction type AccountSet ledger:' + iterator);
                                setAccountTransaction(transaction);
                            }

                            if (transaction.type === 'feeUpdate') { // OK
                                console.log('transaction type AccountSet ledger:' + iterator);
                                const transactionModified = {
                                    ...transaction,
                                    ledgerHash: LedgerFinder.ledgerHash,
                                    ledgerVersion: LedgerFinder.ledgerVersion,
                                    ledgerTimestamp: LedgerFinder.closeTime,
                                    accountId: transaction.address,
                                };
                                setAccountTransaction(transaction);
                                await this.TransactionsRepository.insert(transactionModified);
                            }
                        }
                    }
                    iterator++;
                } catch (error) {
                    console.log('Error in initSync', error.message + ' Nº:' + iterator, error);
                    iterator++;
                }
            }
            // this.syncService.subjectSync.next(false);
            console.log('sync finished');
        }).catch((err) => {
            console.log('Error in connected in CasinoCoin Server' + err);
        });
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
