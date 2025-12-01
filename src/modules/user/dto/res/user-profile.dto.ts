import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, GradeLevel, UserRole } from '@prisma/client';

export class UserProfileDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({
    example: UserRole.LEARNER,
    enum: UserRole,
  })
  role: UserRole;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: '2015-01-15T00:00:00.000Z' })
  dob?: Date;

  @ApiPropertyOptional({
    example: Gender.MALE,
    enum: Gender,
  })
  gender?: Gender;

  @ApiProperty({ example: 1500 })
  xp: number;

  @ApiProperty({ example: 5 })
  streakDays: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({
    example: GradeLevel.GRADE_1,
    enum: GradeLevel,
  })
  grade: GradeLevel;

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({
    example: {
      attempts: 25,
      xpLogs: 50,
      streakLogs: 5,
    },
  })
  _count: {
    attempts: number;
    xpLogs: number;
    streakLogs: number;
  };
}
