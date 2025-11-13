export class StreakStatsDataPointDto {
  date: string;
  xpEarned: number;
}

export class StreakStatsResponseDto {
  data: StreakStatsDataPointDto[];
  totalXP: number;
  days: number;
}
