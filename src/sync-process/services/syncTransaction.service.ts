import { setAccountTransaction } from '../class/transactions_types/accountSet';
import { trustTransaction } from '../class/transactions_types/trustSet';
import { kycTransaction } from '../class/transactions_types/kycSet';
import { crnTransaction } from '../class/transactions_types/SetCRNRound';
import { getRepository, Repository } from 'typeorm';
import { Transactions } from '../../transactions/entity/transaction.entity';
import { LedgerDto } from '../../ledgers/dto/ledgerDTO';

import { CasinocoinAPI } from '@casinocoin/libjs';
import { TransactionModifiedDTO } from '../../transactions/dto/transactionModifiedDTO';
import { paymentTransaction } from '../class/transactions_types/payment';
import { Accounts } from '../../accounts/entity/account.entity';
import { Injectable, Logger } from '@nestjs/common';
import { SyncService } from './sync.service';
import { InjectRepository } from '@nestjs/typeorm';
import * as config from 'yaml-config';
const settings = config.readConfig('config.yml');

@Injectable()
export class SyncTransactionsService {

    private cscApi: CasinocoinAPI = new CasinocoinAPI({ server: settings.casinocoinServer });
    // public syncService: SyncService;
    private readonly logger = new Logger(SyncTransactionsService.name);

    constructor(
        @InjectRepository(Transactions)
        private readonly TransactionsRepository: Repository<Transactions>,
    ) {
    }

    public async initSyncTransactions() {
        this.logger.debug('### Process Synchronize Transactions');
        try {
            // Get Last Ledger From DataBase
            const lastLegerVersionAccounts = await this.getLastLedgerAccounts();
            await this.cscApi.connect();
            // Get Last Ledger From CasinoCoin
            const lastLedgerVersionCSC = await this.cscApi.getLedgerVersion();
            // tslint:disable-next-line:max-line-length
            this.logger.debug(`### Process Synchronize Transactions ==> LastLedgerDB : ${ lastLegerVersionAccounts} - actualLegerCSC: ${ lastLedgerVersionCSC}`);

            // compare Last Ledger with leger actually and init Sync in Database
            if (lastLegerVersionAccounts >= 1 && lastLegerVersionAccounts < lastLedgerVersionCSC) {
                this.initSync(lastLegerVersionAccounts + 1, lastLedgerVersionCSC);
                // this.syncService.synchNotifier.next(true);
            }

            if (lastLegerVersionAccounts > lastLedgerVersionCSC) {
                return this.logger.debug('### Process Synchronize Transactions ==> Database Is Actualized');
            }
        } catch (error) {
            return this.logger.debug('### Process Synchronize Transactions ==> Error: ' + error.message);
        }
    }

    public async initSync(lastLegerVersionAccounts, lastLedgerVersionCSC) {
        let iterator = lastLegerVersionAccounts;
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
        console.log('sync finished');
        // this.syncService.synchNotifier.next(false);
    }

    // get last ledgerVersion from database
    private getLastLedgerAccounts = async () => {
        try {
            // const sequenceSource: any = await this.AccountsRepository
            //     .createQueryBuilder('A')
            //     .select('MAX(A.ledgerVersion)', 'max')
            //     .getRawOne();
            // return sequenceSource.max;
            return 0;
        } catch (err) {
            console.log('Error get lastLedgerVersion on DataBase');
            return null;
        }
    }

}
