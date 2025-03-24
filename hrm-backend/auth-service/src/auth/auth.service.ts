import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { RegisterDto } from '@shared/dto/user/register.dto';
import { LoginDto } from '@shared/dto/user/login.dto';
import { User } from '@shared/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { UserDto } from '@shared/dto/user/user.dto';
import { UpdateUserDto } from '@shared/dto/user/update-user.dto';
import { ResponseUserDto } from '@shared/dto/user/response-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject('COMPANY_SERVICE') private readonly client: ClientKafka,
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientKafka,
    @Inject('EXPENSE_SERVICE') private readonly expenseClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.client.subscribeToResponseOf('add-organization'); // Lắng nghe phản hồi từ add-organization
    this.client.subscribeToResponseOf('initialize-branch');
    this.emailClient.subscribeToResponseOf('send-email');
    this.expenseClient.subscribeToResponseOf('initialize-expense-type');
    await Promise.all([
      this.client.connect(),
      this.emailClient.connect(),
      this.expenseClient.connect(),
    ]);
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // OTP 6 chữ số
  }

  async register(registerDto: RegisterDto) {
    const { email, password, organizationName } = registerDto;

    // Kiểm tra email đã tồn tại
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException({
        message: { email: 'Email đã tồn tại trong hệ thống.' },
      });
    }

    // Tạo tổ chức
    let organizationId: number;
    try {
      const organization = await this.client
        .send('add-organization', { organizationName })
        .toPromise();
      organizationId = organization.id;
    } catch (error) {
      console.error('Error adding organization:', error);
      throw new ConflictException({
        message: {
          organizationName: 'Tạo tổ chức không thành công. Vui lòng thử lại.',
        },
      });
    }

    // Tạo OTP và hash mật khẩu
    const otp = this.generateOtp();
    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt());

    // Lưu user vào cơ sở dữ liệu
    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
      otp,
      otpExpires: new Date(Date.now() + 5 * 60 * 1000), // OTP hết hạn sau 5 phút
      isActive: false,
      organization: { id: organizationId },
    });
    const user = await this.userRepository.save(newUser);

    // Thực hiện các tác vụ độc lập song song
    const tasks = [
      this.client
        .send('initialize-branch', {
          data: { branchName: 'Trụ sở chính', organizationId },
        })
        .toPromise(),
      this.expenseClient.send('initialize-expense-type', { user }).toPromise(),
      this.emailClient
        .send('send-email', {
          to: email,
          subject: 'Verify your email',
          text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
        })
        .toPromise(),
    ];

    // Chạy tất cả các tác vụ song song, không bị chặn bởi lỗi
    const results = await Promise.allSettled(tasks);

    console.log(results);

    return {
      message: 'User registered successfully. Please verify your email.',
    };
  }

  async updateInfomation(id: number, updateDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }
    Object.assign(user, updateDto);
    return this.userRepository.save(user);
  }

  async createUser(
    registerDto: UserDto,
    organizationName: string,
  ): Promise<User> {
    const { email, password, roleId, organizationId } = registerDto;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      const newUser = this.userRepository.create({
        email,
        password: hashedPassword,
        roleId,
        isActive: true,
        organization: { id: organizationId },
      });

      const subject = `Chào mừng bạn đến với ${organizationName}`;
      const html = `
        Đây là thông tin tài khoản của bạn:
        Email: ${email}
        Mật khẩu: ${password}
      `;

      await this.emailClient.emit('send-email', {
        to: email,
        subject,
        text: html,
      });

      return await this.userRepository.save(newUser);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        // Đây là lỗi trùng lặp entry
        throw new BadRequestException({
          message: 'Email đã tồn tại trong hệ thống.',
        });
      }
      throw error; // Nếu là lỗi khác, trả về lỗi mặc định
    }
  }

  async login(loginDto: LoginDto): Promise<{
    user: ResponseUserDto;
    accessToken: string;
    refreshToken: string;
  }> {
    console.log(loginDto);

    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['organization'],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new NotFoundException(
        'Tài khoản hoặc mật khẩu sai. Vui lòng nhập lại.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Tài khoản của bạn chưa được kích hoạt. Vui lòng liên hệ admin để kích hoạt.',
      );
    }

    // Generate a JWT token
    // sub stands for subject (user id)
    const accessToken = await this.generateTokens(user);

    // Optionally, update the user's last login time
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    const responseUser: ResponseUserDto = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      isActive: user.isActive,
      organization: {
        id: user.organization.id,
        organizationName: user.organization.organizationName,
      },
    };

    return {
      user: responseUser,
      accessToken: accessToken.accessToken,
      refreshToken: accessToken.refreshToken,
    };
  }

  async getOtp(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('Email không tồn tại trong hệ thống.');
    }

    const currentTime = new Date();
    if (user.otpExpires && user.otpExpires > currentTime) {
      throw new BadRequestException(
        'OTP hiện tại vẫn còn hiệu lực, vui lòng kiểm tra email của bạn.',
      );
    }

    // Tạo mã OTP mới và cập nhật trong cơ sở dữ liệu
    const newOtp = this.generateOtp();
    user.otp = newOtp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // OTP mới hết hạn sau 5 phút
    await this.userRepository.save(user);

    // Gửi OTP mới qua email
    const subject = 'Your new OTP code';
    const text = `Your OTP code is ${newOtp}. It will expire in 5 minutes.`;
    await this.emailClient.emit('send-email', {
      to: user.email,
      subject,
      text,
    });
  }

  // Hàm xác thực OTP (như đã viết ở phần trước)
  async verifyOtp(otp: string): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { otp },
      relations: ['organization'],
    });

    if (!user) {
      throw new UnauthorizedException(
        'Mã OTP không hợp lệ. Vui lòng nhập lại.',
      );
    }

    if (user.otpExpires < new Date()) {
      throw new UnauthorizedException(
        'OTP đã hết hạn. Vui lòng lấy lại mã OTP.',
      );
    }

    // Kích hoạt tài khoản sau khi OTP hợp lệ
    user.isActive = true;
    user.otp = null;
    user.otpExpires = null;
    await this.userRepository.save(user);

    const resetToken = this.jwtService.sign(
      { email: user.email },
      { expiresIn: '1h' }, // Token hết hạn sau 15 phút
    );

    return resetToken;
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    console.log(email, newPassword);

    try {
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        throw new NotFoundException('Email không tồn tại trong hệ thống.');
      }

      // Hash mật khẩu mới
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Cập nhật mật khẩu mới
      user.password = hashedPassword;
      await this.userRepository.save(user);
    } catch (error) {
      throw new UnauthorizedException('Token không hợp lệ.');
    }
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    // Kiểm tra mật khẩu hiện tại
    const isPasswordMatching = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    console.log('current', currentPassword);
    console.log('user', user.password);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng.');
    }

    // Mã hóa mật khẩu mới và cập nhật
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPassword, salt);

    await this.userRepository.save(user);
  }

  async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.roleId,
      organization: user.organization,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(
    oldRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(oldRefreshToken);

      const newAccessToken = this.jwtService.sign(
        {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
          organization: payload.organization,
        },
        { expiresIn: '2h' },
      );

      const newRefreshToken = this.jwtService.sign(
        {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
          organization: payload.organization,
        },
        { expiresIn: '2d' },
      );

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new UnauthorizedException('Refresh token Không hợp lệ.');
    }
  }

  async validateUser(userId: number) {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
  }

  validateToken(token: string) {
    try {
      return this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    } catch (error) {
      throw new UnauthorizedException('Token không hợp lệ.');
    }
  }
}
