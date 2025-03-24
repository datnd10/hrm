import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { CommonDbModule } from '@shared/config/database/common-db.module';
import { EmployeeModule } from './employee/employee.module';
import { ContractModule } from './contract/contract.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
    }),
    CommonDbModule,
    EmployeeModule,
    ContractModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
