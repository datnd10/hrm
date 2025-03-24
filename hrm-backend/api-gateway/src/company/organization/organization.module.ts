import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { CompanyKafkaModule } from 'src/module/company-kafka.module';
import { AuthKafkaModule } from 'src/module/auth-kafka.module';

@Module({
  imports: [CompanyKafkaModule, AuthKafkaModule],
  controllers: [OrganizationController],
  providers: [OrganizationService],
})
export class OrganizationModule { }
