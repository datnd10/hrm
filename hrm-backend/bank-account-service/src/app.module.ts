import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BankAccountModule } from './bank-account/bank-account.module';
import { ConfigModule } from '@nestjs/config';
import { CommonDbModule } from '@shared/config/database/common-db.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
    }),
    CommonDbModule,
    BankAccountModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
