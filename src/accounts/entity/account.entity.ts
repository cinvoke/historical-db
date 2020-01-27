import { Entity, Unique, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
@Unique(['account'])
export class Account {

    @Column('varchar')
    @PrimaryColumn()
    account: string;

    @Column('integer', {nullable : true})
    sequence: number;

    @Column('simple-json', { nullable: true })
    balances: any;

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

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updateAt: Date;

}
