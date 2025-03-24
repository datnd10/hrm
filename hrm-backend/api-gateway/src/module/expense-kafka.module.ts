import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.registerAsync([
      {
        name: 'EXPENSE_SERVICE',
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'expense',
              brokers: configService
                .get<string>('KAFKA_BROKERS')
                .split(','), // Tách danh sách brokers từ chuỗi
              connectionTimeout: 5000,
              retry: {
                retries: 10,
                initialRetryTime: 300,
                maxRetryTime: 5000,
              },
            },
            consumer: {
              groupId: 'expense-consumer',
              heartbeatInterval: 3000,
              sessionTimeout: 15000,
              maxWaitTimeInMs: 10000,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule], // Export Kafka client để sử dụng ở các module khác
})
export class ExpenseKafkaModule { }
