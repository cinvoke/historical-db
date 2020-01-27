import { Controller, Get, Res, HttpStatus, Param, Body } from '@nestjs/common';
import { AccountsService } from '../services/accounts.service';
import { Account } from '../class/Account';

@Controller('account')
export class AccountsController {
    constructor(
        private accountsService: AccountsService,
    ) { }

    @Get()
    async getAllAccounts(@Res() response) {
        const allAccounts: Account[] = await this.accountsService.getAll();
        if (!allAccounts) { return response.status(HttpStatus.FORBIDDEN).json('Error Getting  All Accounts'); }
        const allCounts = allAccounts.map( item =>  item.account );
        return response.status(HttpStatus.OK).json(allCounts);
    }

    @Get(':id')
    updateCat( @Param('id') param , @Body() account: Account  ): object {
        return { status : `Updated user Successfully ${param}`};
    }
}
