import { ApiProperty } from '@nestjs/swagger';

export class OTPResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Mã OTP đã được gửi đến email của bạn' })
  message: string;

  @ApiProperty({
    example: '2024-11-16T23:00:00.000Z',
    description: 'Expiration time',
  })
  expiresAt?: Date;
}

export class VerifyOTPResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Xác thực OTP thành công' })
  message: string;
}
