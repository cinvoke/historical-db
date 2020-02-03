import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LedgersModule } from './ledgers/ledgers.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions';
import { SyncModule } from './sync-process/sync.module';
import { SyncService } from './sync-process/services/sync/sync.service';
import { Accounts } from './accounts/entity/account.entity';
import { Transactions } from './transactions/entity/transaction.entity';
import { Ledgers } from './ledgers/entity/ledger.entity';
import { AccVersionModule } from './account-version/acc-version.module';
import * as config from 'yaml-config';
import { AccountVersions } from './account-version/entity/accountVersion.entity';
import { ScheduleModule } from '@nestjs/schedule';

// load settings
const settings = config.readConfig('config.yml');

@Module({
  imports: [
    LedgersModule,
    TypeOrmModule.forRoot({
      type: settings.database.type,
      host: settings.database.host,
      port: settings.database.port,
      username: settings.database.username,
      password: settings.database.password,
      database: settings.database.database,
      entities: [Transactions, Accounts, Ledgers, AccountVersions],
      synchronize: false,
    }),
    AccountsModule,
    TransactionsModule,
    SyncModule,
    AccVersionModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService, SyncService],
})
export class AppModule {}
