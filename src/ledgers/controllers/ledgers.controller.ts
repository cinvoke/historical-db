import { LedgersService } from './../services/ledgers.service';
import { Controller, Get, Res, HttpStatus } from '@nestjs/common';

@Controller('ledgers')
export class LedgersController {
    constructor(
        private ledgersService: LedgersService,
    ) { }

    @Get()
    async getAllLedgers(@Res() response) {
        const allLedgers = await this.ledgersService.getAll();
        if (!allLedgers) { return response.status(HttpStatus.FORBIDDEN).json('Error get All Ledgers '); }
        return response.status(HttpStatus.OK).json(allLedgers);
    }
}
