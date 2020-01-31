export class AccountDTO {
    account: string;
    sequence: number;
    balances: any;
    ledgerHash: string;
    ownerCount: number;
    ledgerTimestamp: Date;
    previousAffectingTransactionID: string;
    previousAffectingTransactionLedgerVersion: number;
    previousInitiatedTransactionID: string;
}
