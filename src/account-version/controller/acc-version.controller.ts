import { Controller, UseInterceptors, Post, Body, Res, HttpException, HttpStatus } from '@nestjs/common';
import { MorganInterceptor } from 'nest-morgan';
import { AccVersionService } from '../services/acc-version.service';

@Controller('acc-versions')
export class AccVersionController {

      constructor(
        private accVersionService: AccVersionService,
    ) { }

    @UseInterceptors(MorganInterceptor('dev'))
    @Post('')
    async getAccountVersion(@Body() body, @Res() response) {
        console.log(body);
        const { ledgerVersion, accountId } = body;
        if (!body || !ledgerVersion || !accountId) { throw new HttpException({ status: HttpStatus.FORBIDDEN, error: 'missing options' }, 403); }
        const limitedFinder = await this.accVersionService.getAccountVersion(body);
        if (!limitedFinder) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST, error: 'Not found transactions',
            }, 400);
        }
        return response.status(HttpStatus.OK).json(limitedFinder);
    }
}
