import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { LedgersController } from './controllers/ledgers.controller';
import { LedgersService } from './services/ledgers.service';
import { Ledgers } from './entity/ledger.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ledgers])],
  controllers: [LedgersController],
  providers: [LedgersService],
})
export class LedgersModule {}
