import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { typeOrmAsyncConfig } from './database.config';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true, // Đảm bảo ConfigModule khả dụng trong toàn bộ ứng dụng
            envFilePath: '.env.development',
        }), // Ensure ConfigModule is loaded
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => typeOrmAsyncConfig(configService),
        }),
    ],
    exports: [TypeOrmModule], // Export TypeOrmModule to other modules
})
export class CommonDbModule { }
