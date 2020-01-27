export class TransactionDTO {
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
