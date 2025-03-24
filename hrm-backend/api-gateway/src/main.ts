import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { HttpExceptionFilter } from './common/exception';
import { ResponseInterceptor } from './common/serialize.interceptor';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,  // Loại bỏ các field không nằm trong DTO
    forbidNonWhitelisted: true,  // Báo lỗi nếu có field không thuộc DTO
    transform: true,
    exceptionFactory: (errors: ValidationError[]) => {
      // Hàm đệ quy để xử lý lỗi trong `children`
      const formatErrors = (error) => {
        const formattedError = {
          field: error.property,
          errors: Object.values(error.constraints || []),
          children: error.children ? error.children.map(formatErrors) : [],
        };

        return formattedError;
      };

      // Xử lý lỗi từ gốc và định dạng các lỗi đệ quy trong `children`
      const formattedErrors = errors.map(formatErrors);

      return new BadRequestException(formattedErrors); 2
    },  // Tự động transform các kiểu dữ liệu
  }));
  app.setGlobalPrefix('/api/v1');

  const corsOrigins = configService.get<string>('CORS_ORIGIN').split(',');
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
  });

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
}
bootstrap();
