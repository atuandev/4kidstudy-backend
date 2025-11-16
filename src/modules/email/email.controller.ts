import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailService } from './email.service';
import {
  SendOTPDto,
  VerifyOTPDto,
  OTPResponseDto,
  VerifyOTPResponseDto,
} from './dto';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Gửi mã OTP đến email',
    description:
      'Gửi mã OTP 6 số đến email để xác thực (có hiệu lực trong 1 phút)',
  })
  @ApiResponse({
    status: 200,
    description: 'Gửi OTP thành công',
    type: OTPResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Không thể gửi OTP',
  })
  async sendOTP(@Body() dto: SendOTPDto): Promise<OTPResponseDto> {
    const expiresAt = await this.emailService.sendOTP(dto.email);

    return {
      success: true,
      message: 'Mã OTP đã được gửi đến email của bạn',
      expiresAt,
    };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xác thực mã OTP',
    description: 'Xác thực mã OTP 6 số đã được gửi đến email',
  })
  @ApiResponse({
    status: 200,
    description: 'Xác thực OTP thành công',
    type: VerifyOTPResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  async verifyOTP(@Body() dto: VerifyOTPDto): Promise<VerifyOTPResponseDto> {
    await this.emailService.verifyOTP(dto.email, dto.code);

    return {
      success: true,
      message: 'Xác thực OTP thành công',
    };
  }
}
