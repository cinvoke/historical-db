import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LedgersModule } from './ledgers/ledgers.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { Accounts } from './accounts/entity/account.entity';
import { Transactions } from './transactions/entity/transaction.entity';
import { Ledgers } from './ledgers/entity/ledger.entity';
import { AccVersionModule } from './account-version/acc-version.module';
import { AccountVersions } from './account-version/entity/accountVersion.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { SpecialAccountsModule } from './specialaccounts/specialaccounts.module';
import { SpecialAccount } from './specialaccounts/entity/specialAccount.entity';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MorganModule, MorganInterceptor } from 'nest-morgan';
import * as config from 'yaml-config';
import { GlobalModule } from './global/global.module';
import { SyncModule } from './sync-process/sync.module';

// load settings
const settings = config.readConfig('config.yml');

@Module({
  imports: [
    GlobalModule,
    LedgersModule,
    TypeOrmModule.forRoot({
      type: settings.database.type,
      host: settings.database.host,
      port: settings.database.port,
      username: settings.database.username,
      password: settings.database.password,
      database: settings.database.database,
      entities: [Transactions, Accounts, Ledgers, AccountVersions, SpecialAccount],
      synchronize: true,
    }),
    AccountsModule,
    TransactionsModule,
    AccVersionModule,
    ScheduleModule.forRoot(),
    SpecialAccountsModule,
    MorganModule.forRoot(),
    SyncModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MorganInterceptor('dev'),
    },
  ],
})
export class AppModule {}
