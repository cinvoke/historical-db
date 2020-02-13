import { Controller, Get, Res, HttpStatus, HttpException, Post, Body, UseInterceptors } from '@nestjs/common';
import { SpecialAccountService } from '../services/special-account.service';
import { MorganInterceptor } from 'nest-morgan';

@Controller('special-accounts')
export class SpecialAccountController {
     constructor(
        private specialAccountService: SpecialAccountService,
     ) { }

    @UseInterceptors(MorganInterceptor('dev'))
    @Get('')
    async getAllSpecialAccounts(@Res() response) {
        try {
            const allTransactions = await this.specialAccountService.getAll();
            if (!allTransactions) { return response.status(HttpStatus.FORBIDDEN).json('Error Get all Transactions'); }
            return response.status(HttpStatus.OK).json(allTransactions);
        } catch (error) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                error: error.message,
            }, 400);
        }
    }

    @UseInterceptors(MorganInterceptor('dev'))
    @Post('')
    async insertSpecialAccount(@Body() body, @Res() response) {
        console.log(body);
        try {
            if (!body.AccountID || !body.Label || !body.Type) {
                throw new HttpException({ status: HttpStatus.FORBIDDEN, error: 'missing options' }, 403);
            }
            const limitedFinder = await this.specialAccountService.insertSpecialAccount(body);
            if (limitedFinder === null) {
                throw new HttpException({
                    status: HttpStatus.BAD_REQUEST, error: 'Not found transactions',
                }, 400);
            }
            return response.status(HttpStatus.OK).json(limitedFinder);
        } catch (error) {
            throw new HttpException({
            status: HttpStatus.BAD_REQUEST,
            error: error.message,
            }, 400);
        }
    }
}
