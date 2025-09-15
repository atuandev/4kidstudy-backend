import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'LEARNER', enum: ['ADMIN', 'LEARNER'] })
  role: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: '2015-01-15' })
  dob?: Date;

  @ApiPropertyOptional({ example: 'MALE', enum: Gender })
  gender?: Gender;
}
