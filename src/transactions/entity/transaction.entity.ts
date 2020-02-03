import { Entity, Column, Unique, CreateDateColumn, PrimaryColumn } from 'typeorm';

@Entity()
@Unique(['id'])
export class Transactions {

    @Column('varchar', {nullable : true})
    ledgerHash: string;

    @Column('integer', {nullable : true})
    ledgerVersion: number;

    @Column('timestamp', {nullable : true})
    ledgerTimestamp: Date;

    @Column('varchar', {nullable : true})
    type: string;

    @Column('varchar', {nullable : true})
    address: string;

    @Column('integer', {nullable : true})
    sequence: number;

    @Column('varchar', {nullable : true})
    @PrimaryColumn()
    id: string;

    @Column('json', {nullable : true})
    specification: {
        source?: {
            address: string,
            maxAmount: {
                currency: string,
                value: string,
                counterparty: string;
            };
        },
        destination?: {
            address: string,
            amount: {
                currency: string,
                value: string,
                counterparty: string;
            };
        };
        FeesDistributed?: string
        CRNs?: [],
        LedgerSequence?: number,
        CRNTXHistory?: any[]
        limit?: string,
        currency?: string,
        counterparty?: string,
    };

    @Column('json', {nullable : true})
    outcome: {
        result: string,
        fee: string,
        balanceChanges: any[],
        orderbookChanges: string,
        ledgerVersion: number,
        indexInLedger: number,
        deliveredAmount: Array<{ currency: string, value: string, counterparty: string; }>,
    };

    @Column()
    @CreateDateColumn()
    createdAt: Date;
}
