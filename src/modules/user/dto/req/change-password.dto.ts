import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password of the user',
    example: 'OldPassword123',
    minLength: 8,
  })
  @IsString({ message: 'Mật khẩu hiện tại phải là chuỗi' })
  @MinLength(1, { message: 'Mật khẩu hiện tại không được để trống' })
  currentPassword: string;

  @ApiProperty({
    description: 'New password for the user',
    example: 'NewPassword123',
    minLength: 8,
  })
  @IsString({ message: 'Mật khẩu mới phải là chuỗi' })
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  newPassword: string;
}
