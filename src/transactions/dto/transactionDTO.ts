export class TransactionDTO {
    type?: string;
    address?: string;
    sequence?: number;
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
        balanceChanges: {
            account: string,
            value: string,
            counterparty: string;
        },
        orderbookChanges: string,
        ledgerVersion: number,
        indexInLedger: number,
        deliveredAmount: {
            currency: string,
            value: string,
            counterparty: string;
        };
    };
}
