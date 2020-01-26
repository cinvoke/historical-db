import { Module } from '@nestjs/common';
import { AccountsService } from './services/accounts.service';
import { AccountsController } from './controllers/accounts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entity/account.entity';

@Module({
  imports : [TypeOrmModule.forFeature([Account])],
  providers: [AccountsService],
  controllers: [AccountsController],
})
export class AccountsModule {}
