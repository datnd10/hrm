import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const typeOrmAsyncConfig = (configService: ConfigService): TypeOrmModuleOptions => {
    return {
        type: 'mariadb',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT'), 10),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: ['dist/**/*.entity.js'],
        synchronize: true,
        migrations: ['dist/db/migrations/*{.ts,.js}'],
        charset: 'utf8mb4',
    };
};


const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
    type: 'mariadb',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    entities: ['dist/**/*.entity.js'],
    synchronize: true, // Turn off in production
    migrations: ['dist/db/migrations/*{.ts,.js}'],
    charset: 'utf8mb4', // Cấu hình charset
};

const dataSource = new DataSource(dataSourceOptions); //4
export default dataSource;