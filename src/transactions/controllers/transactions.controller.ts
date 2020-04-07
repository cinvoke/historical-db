import { TransactionsService } from './../services/transactions.service';
import { Controller, Get, Res, HttpStatus, HttpException, Param, Post, Body } from '@nestjs/common';


@Controller('transactions')
export class TransactionsController {
    constructor(
        private transactionsService: TransactionsService,
    ) { }


    @Get('')
    async getAllTransactions(@Res() response) {
        try {
            const allTransactions = await this.transactionsService.getAll();
            if (!allTransactions) { return response.status(HttpStatus.FORBIDDEN).json('Error Get all Transactions'); }
            return response.status(HttpStatus.OK).json(allTransactions);
        } catch (error) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                error: 'Error Get all Transactions',
            }, 400);
        }
    }

    @Get(':ledgerHash')
    async getTransaction(@Param('ledgerHash') ledgerHash, @Res() response) {
        if (!ledgerHash) { throw new HttpException({ status: HttpStatus.FORBIDDEN, error: 'missing ledgerHash' }, 403); }
        const transactionFinder = await this.transactionsService.getTransaction(ledgerHash);
        if (!transactionFinder) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST, error: 'Not found transactions',
            }, 400);
        }
        return response.status(HttpStatus.OK).json(transactionFinder);
    }


    @Get('findMovements/:account')
    async findTxMe(@Param('account') account, @Res() response) {
        if (!account) { throw new HttpException({ status: HttpStatus.FORBIDDEN, error: 'missing Account' }, 403); }
        const accountFinder = await this.transactionsService.findTxMe(account);
        if (!accountFinder) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST, error: 'Not found account',
            }, 400);
        }
        return response.status(HttpStatus.OK).json(accountFinder);
    }

    @Post('limited')
    async getLimitedTransactions(@Body() body, @Res() response) {
        console.log(body);
        const { skip, take, account } = body;
        if (!body || !skip || !take || !account) { throw new HttpException({ status: HttpStatus.FORBIDDEN, error: 'missing options' }, 403); }
        const limitedFinder = await this.transactionsService.getLimitedTransactions(body);
        if (!limitedFinder) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST, error: 'Not found transactions',
            }, 400);
        }
        return response.status(HttpStatus.OK).json(limitedFinder);
    }

    @Post('limitedByAccount')
    async getLimitedTransactionsByAccount(@Body() body, @Res() response) {
        console.log(body);
        const { skip, take, account } = body;
        if (!body || !skip || !take || !account) { throw new HttpException({ status: HttpStatus.FORBIDDEN, error: 'missing options' }, 403); }
        const limitedFinder = await this.transactionsService.getLimitedTransactionsByAccount(body);
        if (!limitedFinder) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST, error: 'Not found transactions',
            }, 400);
        }
        return response.status(HttpStatus.OK).json(limitedFinder);
    }
}
