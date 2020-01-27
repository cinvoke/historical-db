import { getRepository } from 'typeorm';
import { Transaction } from '../../transactions/entity/transaction.entity';
import { TransactionDTO } from '../../transactions/dto/transactionDTO';
import { LedgerDto } from '../../ledgers/dto/ledgerDTO';

import { CasinocoinAPI } from '@casinocoin/libjs';
import * as config from 'yaml-config';
import { SyncAccount } from './syncAccount';
import { TransactionModifiedDTO } from '../../transactions/dto/transactionModifiedDTO';
const settings = config.readConfig('config.yml');
export class SyncTransaction {

    private cscApi: CasinocoinAPI = new CasinocoinAPI({ server: settings.casinocoinServer });
    private LastLegerVersion;
    private initLedgerVersion;
    private TransactionRepository = getRepository(Transaction);

    constructor(initLedgerVersion: number, LastLegerVersion: number) {
        this.initLedgerVersion = initLedgerVersion;
        this.LastLegerVersion = LastLegerVersion;
        this.initSyncTransactions(this.initLedgerVersion, this.LastLegerVersion );
    }

    private async initSyncTransactions(initLedgerVersion, LastLegerVersion) {
        let iterator = initLedgerVersion;
        this.cscApi.connect().then(async () => {
            while (initLedgerVersion < LastLegerVersion) {
                try {
                    const LedgerFinder: LedgerDto = await this.cscApi.getLedger({
                        ledgerVersion: iterator, includeTransactions: true, includeAllData: true, includeState: true,
                    });

                    if (LedgerFinder.transactions) {
                        // modified ledger Transactions for saved in DB
                        const transactionsModified: TransactionModifiedDTO[] = this.transactionsModified(LedgerFinder);
                        // send tx modified for add accounts
                        await this.processTx(transactionsModified);
                    }
                    iterator++;
                } catch (error) {
                    console.log('Error in init', error.message + ' Nº:' + iterator);
                    iterator++;
                }
            }

        }).catch((err) => {
            console.log('Error in connected in CasinoCoin Server' + err);
        });
    }

    private transactionsModified(LedgerFinder: LedgerDto): TransactionModifiedDTO[] {

        const transactionsChecks = LedgerFinder.transactions.map((element: TransactionDTO): TransactionModifiedDTO => {
            const balanceChanges: Array<{ account, value, currency }> = [];
            const countOutcome = Object.keys(element.outcome.balanceChanges).length;
            const sourceAccount = element.specification.source.address;
            const destinationAccount = element.specification.destination.address;

            if (countOutcome >= 3) {
                // Filter accounts for process your balances
                const filterAccount =  account => account === sourceAccount || account === destinationAccount;
                const balanceCh = Object.getOwnPropertyNames(element.outcome.balanceChanges)
                                    .filter( filterAccount)
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
        });
        return transactionsChecks;
    }

    private processTx = async (transactionsChecks: TransactionModifiedDTO[]) => {
        // loop for every transactionCheck
        for await (const transaction of transactionsChecks) {
            // Verification of Transaction type
            if (transaction.type === 'payment') {
                // loop for every transaction and take accounts
                for await (const item of transaction.outcome.balanceChanges) {
                    const syncAccount = new SyncAccount(transaction, item);
                    // Insert the transaction
                    await this.TransactionRepository.insert(transaction);
                }
            } else {
                await this.TransactionRepository.insert(transaction);
            }
        }
    }
}
