import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobModule } from './job/job.module';
import { ConfigModule } from '@nestjs/config';
import { CommonDbModule } from '@shared/config/database/common-db.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
    }),
    CommonDbModule,
    JobModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
