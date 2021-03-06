import { Controller, Get, Res, HttpStatus, Param, Body, HttpException } from '@nestjs/common';
import { AccountsService } from '../services/accounts.service';
import { CasinocoinService } from '../../casinocoin/casinocoin.service';
import { Account } from '../class/Account';
import * as config from 'yaml-config';
const settings = config.readConfig('config.yml');

@Controller('accounts')
export class AccountsController {

    constructor(
        private accountsService: AccountsService,
        private casinocoinService: CasinocoinService,
    ) { }

    @Get('')
    async getAllAccounts(@Res() response) {
        try {
            const allAccounts: Account[] = await this.accountsService.getAll();
            if (!allAccounts) { return response.status(HttpStatus.FORBIDDEN).json('Error Getting  All Accounts'); }
            const allCounts = allAccounts.map( item =>  item.accountId );
            return response.status(HttpStatus.OK).json(allCounts);
        } catch (error) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                error: error.message,
            }, 400);
        }
    }

    @Get('tokens')
    getAllTransactions(@Res() response) {
        this.casinocoinService.cscAPI.getConfigInfo('Token').then((tokens: any) => {
            if (tokens) {
                response.status(HttpStatus.OK).json(tokens);
            }
        }).catch((err) => {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                error: 'Error Get all Transactions',
            }, 400);
        });
    }

    @Get('/:account')
    async findAccount(@Param('account') account, @Res() response) {

        if (!account) { throw new HttpException({ status: HttpStatus.FORBIDDEN, error: 'missing Account' }, 403); }
        const accountFinder = await this.accountsService.getAccount(account);
        if (!accountFinder) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST, error: 'Not found account',
            }, 400);
        }
        return response.status(HttpStatus.OK).json(accountFinder);
    }

}
