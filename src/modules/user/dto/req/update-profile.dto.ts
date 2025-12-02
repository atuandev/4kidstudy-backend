import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, GradeLevel } from '@prisma/client';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'User full name',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  name?: string;

  @ApiPropertyOptional({
    example: GradeLevel.GRADE_1,
    enum: GradeLevel,
    description: 'User grade level',
  })
  @IsOptional()
  @IsEnum(GradeLevel, { message: 'Khối lớp không hợp lệ' })
  grade?: GradeLevel;

  @ApiPropertyOptional({
    example: '2015-01-15',
    description: 'Date of birth in ISO format',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không hợp lệ' })
  dob?: string;

  @ApiPropertyOptional({
    example: Gender.MALE,
    enum: Gender,
    description: 'User gender',
  })
  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ' })
  gender?: Gender;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/...',
    description: 'Avatar URL (will be uploaded to Cloudinary)',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
