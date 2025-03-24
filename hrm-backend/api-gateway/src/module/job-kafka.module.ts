import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot(),
        ClientsModule.registerAsync([
            {
                name: 'JOB_SERVICE',
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.KAFKA,
                    options: {
                        client: {
                            clientId: 'job',
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
                            groupId: 'job-consumer',
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
    exports: [ClientsModule],
})
export class JobKafkaModule { }
