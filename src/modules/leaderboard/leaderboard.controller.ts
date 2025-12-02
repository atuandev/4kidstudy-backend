import { GetStreakStatsQueryDto } from './dtos/req/get-streak-stats.dto';
import { GetXPStatsQueryDto } from './dtos/req/get-xp-stats.dto';
import { StreakStatsResponseDto } from './dtos/res/streak-stats-response.dto';
import { XPStatsResponseDto } from './dtos/res/xp-stats-response.dto';
import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeaderboardResponseDto, TopicXPStatsResponseDto } from './dtos/res';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('streak-stats')
  async getStreakStats(
    @Req() req: any,
    @Query() query: GetStreakStatsQueryDto,
  ): Promise<StreakStatsResponseDto> {
    const userId = req.user.id;
    const days: number = query.days ?? 7;
    return this.leaderboardService.getStreakStats(userId, days);
  }

  @Get('xp-stats')
  async getXPStats(
    @Req() req: any,
    @Query() query: GetXPStatsQueryDto,
  ): Promise<XPStatsResponseDto> {
    const userId = req.user.id;
    const days: number = query.days ?? 7;
    return this.leaderboardService.getXPStats(userId, days);
  }

  @Get('topic-xp-stats')
  async getTopicXPStats(
    @Req() req: any,
    @Query() query: GetXPStatsQueryDto,
  ): Promise<TopicXPStatsResponseDto> {
    const userId = req.user.id;
    const days: number = query.days ?? 7;
    return this.leaderboardService.getTopicXPStats(userId, days);
  }

  @Get('weekly')
  async getWeeklyLeaderboard(@Req() req: any): Promise<LeaderboardResponseDto> {
    const userId = req.user.id;
    return this.leaderboardService.getWeeklyLeaderboard(userId);
  }
}
