import { TransactionDTO } from '../../transactions/dto/transactionDTO';

export class LedgerDto {
    stateHash: string;
    closeTime: Date;
    closeTimeResolution: number;
    closeFlags: number;
    ledgerHash: string;
    ledgerVersion: number;
    parentLedgerHash: string;
    parentCloseTime: Date;
    totalDrops: string;
    transactionHash: string;
    transactions: TransactionDTO[];
    rawTransactions: string;
    rawState: string;
}
