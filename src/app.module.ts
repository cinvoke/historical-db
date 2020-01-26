import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LedgersModule } from './ledgers/ledgers.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './accounts/entity/account.entity';
import { Ledger } from './ledgers/entity/ledger.entity';
import { Transaction } from './transactions/entity/transaction.entity';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { SyncModule } from './sync-process/sync.module';
import { SyncService } from './sync-process/services/sync/sync.service';
import * as config from 'yaml-config';

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
      entities: [Ledger, Account, Transaction],
      synchronize: true,
    }),
    AccountsModule,
    TransactionsModule,
    SyncModule,
  ],
  controllers: [AppController],
  providers: [AppService, SyncService],
})
export class AppModule {}
