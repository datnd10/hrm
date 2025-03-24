import { Module } from '@nestjs/common';
import { BankAccountService } from './bank-account.service';
import { BankAccountController } from './bank-account.controller';
import { AuthKafkaModule } from 'src/module/auth-kafka.module';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { BankAccountKafkaModule } from 'src/module/bank-account-kafka.module';

@Module({
  imports: [AuthKafkaModule, AuthKafkaModule, BankAccountKafkaModule],
  controllers: [BankAccountController],
  providers: [BankAccountService, JwtAuthGuard, RolesGuard],
})
export class BankAccountModule {}
