import { TransactionsService } from './../services/transactions.service';
import { Controller, Get, Res, HttpStatus, HttpException, Param, Post, Body } from '@nestjs/common';
import { Transaction } from '@nestjs/common/interfaces/external/kafka-options.interface';
import { TransactionRepository } from 'typeorm';

@Controller('transactions')
export class TransactionsController {
    constructor(
        private transactionsService: TransactionsService,
    ) { }

    @Get()
    async getAllTransactions(@Res() response) {
        try {
            const allTransactions = await this.transactionsService.getAll();
            if (!allTransactions) { return response.status(HttpStatus.FORBIDDEN).json('Error Get all Transactions'); }
            return response.status(HttpStatus.OK).json(allTransactions);
        } catch (error) {
            throw new HttpException({
                status: HttpStatus.FORBIDDEN,
                error: 'Error Get all Transactions',
            }, 403);
        }
    }

    @Get(':ledgerHash')
    async getTransaction(@Param('ledgerHash') ledgerHash, @Res() response) {
        if (!ledgerHash) { throw new HttpException({ status: HttpStatus.FORBIDDEN, error: 'missing ledgerHash' }, 403); }
        const transactionFinder = await this.transactionsService.getTransaction(ledgerHash);
        if (!transactionFinder) {
            throw new HttpException({
                status: HttpStatus.FORBIDDEN, error: 'Not found transactions',
            }, 403);
        }
        return response.status(HttpStatus.OK).json(transactionFinder);
    }

    @Get('findMovements/:account')
    async findTxMe(@Param('account') account, @Res() response) {
        if (!account) { throw new HttpException({ status: HttpStatus.FORBIDDEN, error: 'missing Account' }, 403); }
        const accountFinder = await this.transactionsService.findTxMe(account);
        if (!accountFinder) {
            throw new HttpException({
                status: HttpStatus.FORBIDDEN, error: 'Not found account',
            }, 403);
        }
        return response.status(HttpStatus.OK).json(accountFinder);
    }

    @Post()
    async getLimitedTransactions(@Body() body , @Res() response) {
        if (!body) { throw new HttpException({ status: HttpStatus.FORBIDDEN, error: 'missing options' }, 403); }
        const limitedFinder = await this.transactionsService.findTxMe(body);
        if (!limitedFinder) {
            throw new HttpException({
                status: HttpStatus.FORBIDDEN, error: 'Not found transactions',
            }, 403);
        }
        return response.status(HttpStatus.OK).json(limitedFinder);
    }
}
