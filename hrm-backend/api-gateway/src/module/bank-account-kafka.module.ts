import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global() // Đánh dấu module này là global để có thể sử dụng trong toàn ứng dụng
@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.registerAsync([
      {
        name: 'BANK_ACCOUNT_SERVICE',
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'bank-account',
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
              groupId: 'bank-account-consumer',
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
export class BankAccountKafkaModule { }
