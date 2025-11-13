export class LeaderboardEntryDto {
  userId: number;
  name: string;
  avatarUrl: string | null;
  totalScore: number;
  rank: number;
}

export class LeaderboardResponseDto {
  entries: LeaderboardEntryDto[];
  currentUserRank: number;
  weekStart: string;
  weekEnd: string;
  grade: string;
}
