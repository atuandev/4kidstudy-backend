import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserStatsDto {
  @ApiProperty({ example: 25 })
  totalAttempts: number;

  @ApiProperty({ example: 20 })
  completedLessons: number;

  @ApiProperty({ example: 1500 })
  totalXp: number;

  @ApiProperty({ example: 5 })
  currentStreak: number;

  @ApiProperty({ example: 250 })
  bestDayXp: number;

  @ApiPropertyOptional({ example: '2024-09-10T00:00:00.000Z' })
  bestDay: Date | null;
}
