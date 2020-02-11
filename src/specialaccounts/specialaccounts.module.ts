import { Module } from '@nestjs/common';
import { SpecialAccountService } from './services/special-account.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecialAccount } from './entity/specialAccount.entity';
import { SpecialAccountController } from './controllers/special-account.controller';

@Module({
  imports : [TypeOrmModule.forFeature([SpecialAccount])],
  providers: [SpecialAccountService],
  controllers: [SpecialAccountController],
})
export class SpecialAccountsModule {}
