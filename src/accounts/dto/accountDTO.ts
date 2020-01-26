export class AccountDTO {
    account: string;
    sequence: number;
    balances: any;
    ledgerHash: string;
    ownerCount: number;
    previousAffectingTransactionID: string;
    previousAffectingTransactionLedgerVersion: number;
    previousInitiatedTransactionID: string;
}