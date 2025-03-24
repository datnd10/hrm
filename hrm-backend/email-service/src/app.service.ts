import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
@Injectable()
export class AppService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {

    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('EMAIL_HOST'),
      port: configService.get<number>('EMAIL_PORT'),
      secure: false,
      auth: {
        user: configService.get<string>('EMAIL_USER'),
        pass: configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_USER'),
        to,
        subject,
        text,
      });
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}
