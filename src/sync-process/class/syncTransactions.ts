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
import { paymentTransaction } from './transactions_types/paymet';
const settings = config.readConfig('config.yml');
export class SyncTransaction {

    private cscApi: CasinocoinAPI = new CasinocoinAPI({ server: settings.casinocoinServer });
    private LastLegerVersion;
    private initLedgerVersion;
    private TransactionRepository = getRepository(Transactions);

    constructor(initLedgerVersion: number, LastLegerVersion: number) {
        this.initLedgerVersion = initLedgerVersion;
        this.LastLegerVersion = LastLegerVersion;
        this.initSyncTransactions(this.initLedgerVersion, this.LastLegerVersion );
    }

    private async initSyncTransactions(initLedgerVersion, LastLegerVersion) {
        let iterator = initLedgerVersion;
        this.cscApi.connect().then(async () => {
            while (iterator < LastLegerVersion) {
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
                                // sycn acc
                                await paymentTransaction(transactionModified, this.cscApi);
                                // Insert the transaction
                                await this.TransactionRepository.insert(transactionModified);
                            }
                            if (transaction.type === 'SetCRNRound') { crnTransaction(transaction); }
                            if (transaction.type === 'KYCSet') { kycTransaction(transaction); }
                            if (transaction.type === 'TrustSet') { trustTransaction(transaction); }
                            if (transaction.type === 'AccountSet') { setAccountTransaction(transaction); }
                        }
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

    private transactionsModified(LedgerFinder: LedgerDto): any {

        const transactionsCheck = LedgerFinder.transactions.map((element: TransactionDTO) => {
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
        return transactionsCheck;
    }

}
