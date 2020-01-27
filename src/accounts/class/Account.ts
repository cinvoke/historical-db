import { ApiProperty } from '@nestjs/swagger';

export class Account {
    @ApiProperty({
        description: 'Account for',
        type: String,
    })
    account: string;

    @ApiProperty({
        description: 'The age of a cat',
    })
    sequence: number;

    @ApiProperty({
        description: 'The age of a cat',
    })
    balances: any;

    @ApiProperty({
        description: 'The age of a cat',
    })
    ledgerHash: string;

    @ApiProperty({
        description: 'The age of a cat',
    })
    ownerCount: number;

    @ApiProperty({
        description: 'The age of a cat',
    })
    previousAffectingTransactionID: string;

    @ApiProperty({
        description: 'The age of a cat',
    })
    previousAffectingTransactionLedgerVersion: number;

    @ApiProperty({
        description: 'The age of a cat',
    })
    previousInitiatedTransactionID: string;
}
