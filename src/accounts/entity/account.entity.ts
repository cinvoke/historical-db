import { Entity, Unique, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
@Unique(['account'])
export class Accounts {

    @Column('varchar')
    @PrimaryColumn()
    account: string;

    @Column('integer', {nullable : true})
    sequence: number;

    @Column('integer', {nullable : true})
    ledgerVersion: number;

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