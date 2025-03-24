import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthKafkaModule } from 'src/module/auth-kafka.module';
import { ClientKafka } from '@nestjs/microservices';

@Module({
  imports: [AuthKafkaModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule implements OnModuleInit {
  constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientKafka) { }
  onModuleInit() {
    this.authClient.subscribeToResponseOf('validate_jwt');
  }
}
