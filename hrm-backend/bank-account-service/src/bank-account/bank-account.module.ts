import { Module } from '@nestjs/common';
import { BankAccountService } from './bank-account.service';
import { BankAccountController } from './bank-account.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccount } from '@shared/entities/bank-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BankAccount])],
  controllers: [BankAccountController],
  providers: [BankAccountService],
})
export class BankAccountModule { }
