import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Gender, GradeLevel } from '@prisma/client';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'User password (min 8 characters)',
    example: 'Password123',
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    description: 'User date of birth',
    example: '2015-01-15',
  })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  dob?: Date;

  @ApiPropertyOptional({
    description: 'User gender',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'User grade level',
    enum: GradeLevel,
    example: GradeLevel.GRADE_1,
  })
  @IsEnum(GradeLevel)
  @IsOptional()
  grade?: GradeLevel;
}
