import { Entity, Unique, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class AccountVersions {

    @Column('varchar')
    @PrimaryColumn()
    accountId: string;

    @PrimaryColumn('integer')
    sequence: number;

    @PrimaryColumn('integer')
    ledgerVersion: number;

    @Column('timestamp', {nullable : true})
    ledgerTimestamp: Date;

    @Column('json', { nullable: true })
    kyc: boolean;

    @Column('json', { nullable: true })
    balances: any[];

    @Column('varchar', {nullable : true})
    ledgerHash: string;

    @Column('integer', {nullable : true})
    ownerCount: number;

    @Column('varchar', {nullable : true})
    previousAffectingTransactionID: string;

    @Column('integer', {nullable : true})
    previousAffectingTransactionLedgerVersion: number;

    @Column('varchar', {nullable : true})
    previousInitiatedTransactionID: string;

}