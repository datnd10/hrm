import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExpenseTypeModule } from './expense-type/expense-type.module';
import { ConfigModule } from '@nestjs/config';
import { CommonDbModule } from '@shared/config/database/common-db.module';
import { ExpenseModule } from './expense/expense.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
    }),
    CommonDbModule,
    ExpenseTypeModule,
    ExpenseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
