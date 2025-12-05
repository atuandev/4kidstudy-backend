export class TopicXPDataPointDto {
  topicId: number;
  topicTitle: string;
  xpEarned: number;
  gradeXpEarned: number;
}

export class TopicXPStatsResponseDto {
  data: TopicXPDataPointDto[];
  totalXP: number;
}
