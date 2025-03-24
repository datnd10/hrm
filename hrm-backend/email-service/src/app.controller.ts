import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @MessagePattern('send-email') // Topic mà service khác sẽ gửi message
  async sendEmail(@Payload() data: any) {
    await this.appService.sendEmail(data.to, data.subject, data.text);
  }
}
