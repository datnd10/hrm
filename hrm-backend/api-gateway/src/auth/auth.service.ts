import { Inject, Injectable } from '@nestjs/common';
import { RegisterDto } from '@shared/dto/user/register.dto';
import { LoginDto } from '@shared/dto/user/login.dto';
import { ClientProxy } from '@nestjs/microservices';
import { sendMessageKafka } from 'src/common/kafka.helper';
import { UpdateUserDto } from '@shared/dto/user/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}
  async register(registerDto: RegisterDto): Promise<any> {
    return sendMessageKafka(
      this.authClient,
      'register',
      JSON.stringify(registerDto),
    );
  }

  async updateInfomation(id: number, updateDto: UpdateUserDto) {
    return sendMessageKafka(
      this.authClient,
      'update-infomation',
      JSON.stringify({ id, updateDto }),
    );
  }

  async login(loginDto: LoginDto): Promise<any> {
    return sendMessageKafka(this.authClient, 'login', JSON.stringify(loginDto));
  }

  async refreshToken(data: string) {
    return sendMessageKafka(
      this.authClient,
      'refresh_token',
      JSON.stringify(data),
    );
  }

  async verifyOtp(otp: string) {
    return sendMessageKafka(this.authClient, 'verify-otp', JSON.stringify(otp));
  }

  async getOtp(email: string) {
    return sendMessageKafka(this.authClient, 'get-otp', JSON.stringify(email));
  }

  async resetPassword(email: string, newPassword: string) {
    return sendMessageKafka(
      this.authClient,
      'reset-password',
      JSON.stringify({ email, newPassword }),
    );
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    return sendMessageKafka(
      this.authClient,
      'change-password',
      JSON.stringify({ userId, currentPassword, newPassword }),
    );
  }
}
