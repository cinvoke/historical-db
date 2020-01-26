import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { AccountsService } from '../services/accounts.service';

@Controller('accounts')
export class AccountsController {
    constructor(
        private accountsService: AccountsService,
    ) { }

    @Get()
    async getAllAccounts(@Res() response) {
        const allAccounts = await this.accountsService.getAll();
        if (!allAccounts) { return response.status(HttpStatus.FORBIDDEN).json('Error Created Message'); }
        const allCounts = allAccounts.map( item =>  item.account );
        return response.status(HttpStatus.OK).json(allCounts);
        // return allMessages ? JSON.stringify(allMessages)  : response.status(HttpStatus.FORBIDDEN).json('Error get All Messages ');
    }
}
