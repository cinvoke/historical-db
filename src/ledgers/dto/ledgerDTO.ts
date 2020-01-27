import { TransactionDTO } from '../../transactions/dto/transactionDTO';

export class LedgerDto {
    stateHash: string;
    closeTime: string;
    closeTimeResolution: number;
    closeFlags: number;
    ledgerHash: string;
    ledgerVersion: number;
    parentLedgerHash: string;
    parentCloseTime: string;
    totalDrops: string;
    transactionHash: string;
    transactions?: object[];
    rawTransactions?: string;
    transactionHashes?: string[];
    rawState?: string;
    stateHashes?: string[];
}
