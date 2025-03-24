import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { CommonDbModule } from '@shared/config/database/common-db.module';
import { BranchModule } from './branch/branch.module';
import { DepartmentModule } from './department/department.module';
import { PositionModule } from './position/position.module';
import { OrganizationModule } from './organization/organization.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
    }),
    CommonDbModule,
    BranchModule,
    DepartmentModule,
    PositionModule,
    OrganizationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
