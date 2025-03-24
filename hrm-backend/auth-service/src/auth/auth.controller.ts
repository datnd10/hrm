import {
  Body,
  Controller,
  Inject,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { RegisterDto } from '@shared/dto/user/register.dto';
import { LoginDto } from '@shared/dto/user/login.dto';
import { UserDto } from '@shared/dto/user/user.dto';
import { plainToInstance } from 'class-transformer';
import { handleError } from '@shared/util/error-handler';
import { UpdateUserDto } from '@shared/dto/user/update-user.dto';
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('update-infomation')
  async updateInfomation(@Payload() data: any) {
    try {
      console.log(data);

      const { updateDto, id } = data;
      const userDto = plainToInstance(UpdateUserDto, updateDto);
      const result = await this.authService.updateInfomation(id, userDto);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('verify-otp')
  async verifyOtp(@Body() body: { otp: string }) {
    try {
      const result = await this.authService.verifyOtp(body.otp);
      return { accessToken: result };
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('get-otp')
  async getOtp(@Body() body: { email: string }) {
    try {
      const result = await this.authService.getOtp(body.email);
      return { message: 'OTP đã được gửi vào mail bạn' };
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('change-password')
  async changePassword(
    @Payload()
    data: {
      userId: number;
      currentPassword: string;
      newPassword: string;
    },
  ) {
    try {
      const { userId, currentPassword, newPassword } = data;
      console.log('data', data);
      await this.authService.changePassword(
        userId,
        currentPassword,
        newPassword,
      );
      return { message: 'Đổi mật khẩu thành công.' };
    } catch (error) {
      return { message: error.message || 'Lỗi khi đổi mật khẩu.' };
    }
  }

  @MessagePattern('reset-password')
  async resetPassword(@Body() body: { email: string; newPassword: string }) {
    try {
      const result = await this.authService.resetPassword(
        body.email,
        body.newPassword,
      );
      return { message: 'Mật khẩu thay đổi thành công.' };
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('register')
  async register(@Payload() data: any) {
    try {
      const registerDto = plainToInstance(RegisterDto, data);
      const result = await this.authService.register(registerDto);
      return { message: 'OTP đã được gửi vào mail bạn' };
    } catch (error) {
      console.log(error);
      handleError(error);
    }
  }

  @MessagePattern('create-user')
  async createUser(@Payload() data: any) {
    try {
      console.log(data);
      const { email, password, roleId, organizationId, organizationName } =
        data;
      const registerDto = plainToInstance(UserDto, {
        email,
        password,
        roleId,
        organizationId,
      });
      const result = await this.authService.createUser(
        registerDto,
        organizationName,
      );
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('login')
  async login(@Payload() data: any) {
    try {
      const loginDto = plainToInstance(LoginDto, data);
      const result = await this.authService.login(loginDto);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('validate_jwt')
  async validateJwt(@Payload() token: string) {
    try {
      // Log for debugging
      const payload = this.authService.validateToken(token);
      const user = await this.authService.validateUser(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }
      return {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        organization: user.organization,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @MessagePattern('refresh_token')
  async refreshToken(@Payload() data: any) {
    try {
      const { refreshToken } = data;
      return await this.authService.refreshToken(refreshToken);
    } catch (error) {
      handleError(error);
    }
  }
}
