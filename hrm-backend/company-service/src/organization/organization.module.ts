import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '@shared/entities/organization.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
@Module({
  imports: [
    TypeOrmModule.forFeature([Organization]),
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService],
})
export class OrganizationModule { }
