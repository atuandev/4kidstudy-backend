export class TopicXPDataPointDto {
    topicId: number;
    topicTitle: string;
    xpEarned: number;
}

export class TopicXPStatsResponseDto {
    data: TopicXPDataPointDto[];
    totalXP: number;
}
