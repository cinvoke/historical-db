import { Entity, Column, Unique, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity()
@Unique(['AccountID'])
export class SpecialAccount {

    @Column('integer')
    @PrimaryColumn()
    AccountID: string;

    @Column('varchar', {nullable : true})
    Label: string;

    @Column('varchar', {nullable : true})
    Type: string;

}
