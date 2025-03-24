import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ExcelProcessor } from './excel.processor'
import { ExcelService } from './excel.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true, // Đảm bảo ConfigModule khả dụng trên toàn ứng dụng
        }),
        BullModule.registerQueueAsync({
            name: 'excel-queue',
            useFactory: async (configService: ConfigService) => ({
                redis: {
                    host: configService.get<string>('REDIS_HOST'),
                    port: configService.get<number>('REDIS_PORT'),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [ExcelProcessor, ExcelService],
    exports: [BullModule],
})
export class ExcelQueueModule { }
