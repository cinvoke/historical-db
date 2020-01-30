import { Module } from '@nestjs/common';
import { TransactionsController } from './controllers/transactions.controller';
import { TransactionsService } from './services/transactions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transactions } from './entity/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transactions])],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
