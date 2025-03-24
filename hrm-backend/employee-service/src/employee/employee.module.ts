import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Position } from '@shared/entities/position.entity';
import { Department } from '@shared/entities/department.entity';
import { Employee } from '@shared/entities/employee.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BankAccount } from '@shared/entities/bank-account.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Đảm bảo ConfigModule khả dụng trong toàn ứng dụng
    }),
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule], // Đảm bảo ConfigService được nạp trước
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'employee-service',
              brokers: configService
                .get<string>('KAFKA_BROKERS')
                ?.split(','), // Lấy danh sách brokers từ .env
              connectionTimeout: 5000,
              retry: {
                retries: 10,
                initialRetryTime: 300,
                maxRetryTime: 5000,
              },
            },
            consumer: {
              groupId: 'employee-service-consumer',
              heartbeatInterval: 3000,
              sessionTimeout: 15000,
              maxWaitTimeInMs: 10000,
            },
          },
        }),
      },
    ]),
    TypeOrmModule.forFeature([Employee, Department, Position, BankAccount]),
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
})
export class EmployeeModule { }
