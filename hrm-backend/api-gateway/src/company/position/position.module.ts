import { Module } from '@nestjs/common';
import { PositionService } from './position.service';
import { PositionController } from './position.controller';
import { CompanyKafkaModule } from 'src/module/company-kafka.module';
import { AuthKafkaModule } from 'src/module/auth-kafka.module';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';

@Module({
  imports: [CompanyKafkaModule, AuthKafkaModule],
  controllers: [PositionController],
  providers: [PositionService, JwtAuthGuard, RolesGuard],
})
export class PositionModule { }
