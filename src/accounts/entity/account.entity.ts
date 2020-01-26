import {Entity, Column, Unique, CreateDateColumn, UpdateDateColumn, PrimaryColumn} from 'typeorm';

@Entity()
@Unique(['account'])
export class Account {

    @Column('varchar')
    @PrimaryColumn()
    account: string;

    @Column('integer', {nullable : true})
    sequence: number;

    @Column('float', {nullable : true})
    cscBalance: number;

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

    @Column('integer', {nullable : true})
    T03Balance: number;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updateAt: Date;

}
