import { Entity, Column, Unique, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity()
@Unique(['ledgerVersion'])
export class Ledgers {

    @Column('integer', {nullable : true})
    @PrimaryColumn()
    ledgerVersion: number;

    @Column('varchar', {nullable : true})
    status: string;

    @Column('date', {nullable : true})
    ledgerTimestamp: Date;

    @Column('integer', {nullable : true})
    transactionCount: number;

    @Column('varchar', {nullable : true})
    stateHash: string;

    @Column('varchar', {nullable : true})
    closeTime: string;

    @Column('integer', {nullable : true})
    closeTimeResolution: number;

    @Column('integer', {nullable : true})
    closeFlags: number;

    @Column('varchar', {nullable : true})
    ledgerHash: string;

    @Column('varchar', {nullable : true})
    parentLedgerHash: string;

    @Column('varchar', {nullable : true})
    parentCloseTime: string;

    @Column('varchar', {nullable : true})
    totalDrops: string;

    @Column('varchar', {nullable : true})
    transactionHash: string;
}
