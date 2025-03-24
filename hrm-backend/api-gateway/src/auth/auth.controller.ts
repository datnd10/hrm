import {
  Controller,
  Post,
  Body,
  OnModuleInit,
  Inject,
  Put,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ClientKafka } from '@nestjs/microservices';
import { RegisterDto } from '@shared/dto/user/register.dto';
import { LoginDto } from '@shared/dto/user/login.dto';
import { UpdateUserDto } from '@shared/dto/user/update-user.dto';
@Controller('auth')
export class AuthController implements OnModuleInit {
  constructor(
    private readonly authService: AuthService,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientKafka,
  ) {}
  onModuleInit() {
    this.authClient.subscribeToResponseOf('register');
    this.authClient.subscribeToResponseOf('login');
    this.authClient.subscribeToResponseOf('refresh_token');
    this.authClient.subscribeToResponseOf('verify-otp');
    this.authClient.subscribeToResponseOf('get-otp');
    this.authClient.subscribeToResponseOf('reset-password');
    this.authClient.subscribeToResponseOf('update-infomation');
    this.authClient.subscribeToResponseOf('change-password');
  }

  @Put('/:id')
  async updateInfomation(
    @Body() updateInfomationDto: UpdateUserDto,
    @Param('id') id: string,
  ) {
    return await this.authService.updateInfomation(+id, updateInfomationDto);
  }
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: string) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() otp: string) {
    return this.authService.verifyOtp(otp);
  }

  @Post('get-otp')
  async getOtp(@Body() email: string) {
    return this.authService.getOtp(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: { email: string; newPassword: string },
  ) {
    return this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.newPassword,
    );
  }

  @Post('change-password')
  async changePassword(
    @Body()
    changePasswordDto: {
      userId: number;
      currentPassword: string;
      newPassword: string;
    },
  ) {
    return this.authService.changePassword(
      changePasswordDto.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }
}
