import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@shared/entities/user.entity';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './role-auth.guard';
import { ClientsModule, Transport } from '@nestjs/microservices';
@Module({
  imports: [
    ConfigModule.forRoot(), // Đảm bảo ConfigModule được khởi tạo
    ClientsModule.registerAsync([
      {
        name: 'COMPANY_SERVICE', // Gọi đến Company Service
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'auth-service',
              brokers: configService.get<string>('KAFKA_BROKERS').split(','), // Lấy từ biến môi trường
              connectionTimeout: 5000,
              retry: {
                retries: 10,
                initialRetryTime: 300,
                maxRetryTime: 5000,
              },
            },
            consumer: {
              groupId: 'auth-service-consumer',
              heartbeatInterval: 3000,
              sessionTimeout: 15000,
              maxWaitTimeInMs: 10000,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'EMAIL_SERVICE',
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'auth-service',
              brokers: configService.get<string>('KAFKA_BROKERS').split(','), // Lấy từ biến môi trường
              connectionTimeout: 5000,
              retry: {
                retries: 10,
                initialRetryTime: 300,
                maxRetryTime: 5000,
              },
            },
            consumer: {
              groupId: 'email-service-consumer',
              heartbeatInterval: 3000,
              sessionTimeout: 15000,
              maxWaitTimeInMs: 10000,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: "EXPENSE_SERVICE", // Gọi đến Expense Service
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'auth-service',
              brokers: configService.get<string>('KAFKA_BROKERS').split(','), // Lấy từ biến môi trường
              connectionTimeout: 5000,
              retry: {
                retries: 10,
                initialRetryTime: 300,
                maxRetryTime: 5000,
              },
            },
            consumer: {
              groupId: 'auth-expense-service-consumer',
              heartbeatInterval: 3000,
              sessionTimeout: 15000,
              maxWaitTimeInMs: 10000,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('SECRET'),
        signOptions: {
          expiresIn: '5m'
        }
      }),
      inject: [ConfigService]
    }),

  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
})
export class AuthModule { }
