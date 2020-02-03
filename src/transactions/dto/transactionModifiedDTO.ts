export class TransactionModifiedDTO {
    ledgerHash: string;
    ledgerVersion: number;
    ledgerTimestamp: string;
    type: string;
    address: string;
    sequence: number;
    id: string;
    specification: {
        source: {
            address: string,
            maxAmount: {
                currency: string,
                value: string,
                counterparty: string;
            };
        },
        destination: {
            address: string,
            amount: {
                currency: string,
                value: string,
                counterparty: string;
            };
        },
        memos?: Array<{ format: string; data: string }>;
        KYC?: Array<{ description: string, date: Date, verification: any[] }>
    };
    outcome: {
        result: string,
        fee: string,
        balanceChanges: any[],
        orderbookChanges: string,
        ledgerVersion: number,
        indexInLedger: number,
        deliveredAmount: Array<{ currency: string, value: string, counterparty: string; }>;
    };
}
