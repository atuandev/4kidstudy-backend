import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class SendOTPDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to send OTP',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}
