import { Controller, Get, Res, HttpStatus, Param, Body, HttpException } from '@nestjs/common';
import { AccountsService } from '../services/accounts.service';
import { Account } from '../class/Account';
import { CasinocoinAPI } from '@casinocoin/libjs';
import * as config from 'yaml-config';
const settings = config.readConfig('config.yml');
@Controller('accounts')
export class AccountsController {
    private cscApi: CasinocoinAPI = new CasinocoinAPI({ server: settings.casinocoinServer });
    constructor(
        private accountsService: AccountsService,
    ) { }

    @Get('')
    async getAllAccounts(@Res() response) {
        const allAccounts: Account[] = await this.accountsService.getAll();
        if (!allAccounts) { return response.status(HttpStatus.FORBIDDEN).json('Error Getting  All Accounts'); }
        const allCounts = allAccounts.map( item =>  item.accountId );
        return response.status(HttpStatus.OK).json(allCounts);
    }

    @Get('findAccount/:account')
    updateCat( @Param('account') account  ) {
        console.log(account);
    }

    @Get('tokens')
    getAllTransactions(@Res() response) {
        this.cscApi.connect().then( () => {
            this.cscApi.getConfigInfo('Token').then((tokens: any) => {
                if (tokens) {
                    response.status(HttpStatus.OK).json(tokens);
                }
            });
        }).catch((err) => {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                error: 'Error Get all Transactions',
            }, 400);
        });
    }
}
