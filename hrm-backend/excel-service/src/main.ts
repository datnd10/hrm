import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const appMain = await NestFactory.create(AppModule);
  const configService = appMain.get(ConfigService);

  // Đọc Kafka brokers từ ConfigService
  const kafkaBrokers = configService.get<string>('KAFKA_BROKERS')?.split(',');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'excel',
          brokers: kafkaBrokers,
          connectionTimeout: 5000,
          retry: {
            retries: 10,
            initialRetryTime: 300,
            maxRetryTime: 5000,
          },
        },
        consumer: {
          groupId: 'excel-consumer',
          heartbeatInterval: 3000,
          sessionTimeout: 15000,
          maxWaitTimeInMs: 10000,
        },
      },
    },
  );
  app.listen();
}
bootstrap();
