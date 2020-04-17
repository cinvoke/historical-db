import { setAccountTransaction } from '../class/transactions_types/accountSet';
import { trustTransaction } from '../class/transactions_types/trustSet';
import { kycTransaction } from '../class/transactions_types/kycSet';
import { crnTransaction } from '../class/transactions_types/SetCRNRound';
import { getRepository, Repository } from 'typeorm';
import { Transactions } from '../../transactions/entity/transaction.entity';
import { LedgerDto } from '../../ledgers/dto/ledgerDTO';

import { CasinocoinAPI } from '@casinocoin/libjs';
import * as config from 'yaml-config';
import { TransactionModifiedDTO } from '../../transactions/dto/transactionModifiedDTO';
import { paymentTransaction } from '../class/transactions_types/payment';
import { Accounts } from '../../accounts/entity/account.entity';
import { Injectable, Logger } from '@nestjs/common';
import { SyncService } from './sync.service';
import { CasinocoinService } from '../../casinocoin/casinocoin.service';
import { InjectRepository } from '@nestjs/typeorm';
const settings = config.readConfig('config.yml');

@Injectable()
export class SyncTransactionsService {

    // private cscApi: CasinocoinAPI = new CasinocoinAPI({ server: settings.casinocoinServer });
    public syncService: SyncService;
    private readonly logger = new Logger(SyncTransactionsService.name);

    constructor(
        @InjectRepository(Transactions)
        private readonly TransactionsRepository: Repository<Transactions>,
        @InjectRepository(Accounts)
        private readonly AccountsRepository: Repository<Accounts>,
        private casinocoinService: CasinocoinService,
    ) {
    }

    public async initSyncTransactions() {
        this.logger.debug('### Process Synchronize Transactions');
        const lastLedgerVersionCSC = this.casinocoinService.getLedgerActually();
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

    public async initSync(lastLegerVersionAccounts, lastLedgerVersionCSC) {
        let iterator = lastLegerVersionAccounts;
        console.log('lastLegerVersionAccounts', iterator, 'lastLedgerVersionCSC', lastLedgerVersionCSC);
        while (iterator <= lastLedgerVersionCSC) {
            try {
                const LedgerFinder: LedgerDto = await this.casinocoinService.cscAPI.getLedger({
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
                            await paymentTransaction(transactionModified, this.casinocoinService.cscAPI);
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
                            await crnTransaction(transactionModified, this.casinocoinService.cscAPI);
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
                            await kycTransaction(transactionModified, this.casinocoinService.cscAPI);
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
                            await trustTransaction(transactionModified, this.casinocoinService.cscAPI);
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
        this.syncService.synchNotifier.next(false);
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
