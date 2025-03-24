import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
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
          clientId: 'bank-account',
          brokers: kafkaBrokers,
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
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ các field không nằm trong DTO
      forbidNonWhitelisted: true, // Báo lỗi nếu có field không thuộc DTO
      transform: true, // Tự động transform các kiểu dữ liệu
    }),
  );
  app.listen();
}
bootstrap();
