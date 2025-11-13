export class XPStatsDataPointDto {
  date: string;
  xpEarned: number;
}

export class XPStatsResponseDto {
  data: XPStatsDataPointDto[];
  totalXP: number;
  days: number;
}
