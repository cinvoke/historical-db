export class TransactionDTO {
    type: string;
    accountId: string;
    sequence: number;
    ledgerTimestamp: Date;
    id: string;
    specification: {
        source: {
            accountId: string,
            maxAmount: {
                currency: string,
                value: string,
                counterparty: string;
            };
        },
        destination: {
            accountId: string,
            amount: {
                currency: string,
                value: string,
                counterparty: string;
            };
        };
    };
    outcome: {
        result: string,
        fee: string,
        balanceChanges: Array<{ account: string, value: string, currency: string; }>,
        orderbookChanges: string,
        ledgerVersion: number,
        indexInLedger: number,
        deliveredAmount: Array<{ currency: string, value: string, counterparty: string; }>;
    };
}
