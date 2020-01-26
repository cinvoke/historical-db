import { TransactionsService } from './../services/transactions.service';
import { Controller, Get, Res, HttpStatus } from '@nestjs/common';

@Controller('transactions')
export class TransactionsController {
    constructor(
        private transactionsService: TransactionsService,
    ) { }

    @Get()
    async getAllTransactions(@Res() response) {
        const allTransactions = await this.transactionsService.getAll();
        if (!allTransactions) { return response.status(HttpStatus.FORBIDDEN).json('Error Get all Transactions'); }
        return response.status(HttpStatus.OK).json(allTransactions);
    }
}
