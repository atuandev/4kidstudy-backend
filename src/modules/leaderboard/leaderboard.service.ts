import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  StreakStatsResponseDto,
  XPStatsResponseDto,
  LeaderboardResponseDto,
  LeaderboardEntryDto,
} from './dtos/res';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get streak statistics for a user within specified days
   */
  async getStreakStats(
    userId: number,
    days: number,
  ): Promise<StreakStatsResponseDto> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const streakLogs = await this.prisma.streakLog.findMany({
      where: {
        userId,
        day: {
          gte: startDate,
        },
      },
      orderBy: {
        day: 'asc',
      },
    });

    const data = streakLogs.map((log) => ({
      date: log.day.toISOString().split('T')[0],
      xpEarned: log.xpEarned,
    }));

    const totalXP = streakLogs.reduce((sum, log) => sum + log.xpEarned, 0);

    return {
      data,
      totalXP,
      days,
    };
  }

  /**
   * Get XP statistics for a user within specified days
   */
  async getXPStats(userId: number, days: number): Promise<XPStatsResponseDto> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const xpLogs = await this.prisma.xPLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const groupedByDate = xpLogs.reduce(
      (acc, log) => {
        const date = log.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += log.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    const data = Object.entries(groupedByDate).map(([date, amount]) => ({
      date,
      xpEarned: amount,
    }));

    const totalXP = xpLogs.reduce((sum, log) => sum + log.amount, 0);

    return {
      data,
      totalXP,
      days,
    };
  }

  /**
   * Get weekly leaderboard for user's grade
   * Resets every Sunday (week starts on Monday)
   */
  async getWeeklyLeaderboard(userId: number): Promise<LeaderboardResponseDto> {
    // Get current user's grade
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { grade: true, name: true, avatarUrl: true },
    });

    if (!currentUser) {
      throw new Error('User not found');
    }

    // Calculate current week's Monday
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    // If Sunday (0), go back 6 days to Monday, otherwise go back (dayOfWeek - 1) days
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(monday.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);

    // Get next Monday (end of current week)
    const nextMonday = new Date(monday);
    nextMonday.setDate(nextMonday.getDate() + 7);

    // Get all users in same grade
    const users = await this.prisma.user.findMany({
      where: {
        grade: currentUser.grade,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    });

    // Calculate scores for each user based on completed attempts this week
    const leaderboardEntries: LeaderboardEntryDto[] = [];

    for (const user of users) {
      const attempts = await this.prisma.attempt.findMany({
        where: {
          userId: user.id,
          isCompleted: true,
          createdAt: {
            gte: monday,
            lt: nextMonday,
          },
        },
        select: {
          totalScore: true,
        },
      });

      const totalScore = attempts.reduce(
        (sum, attempt) => sum + attempt.totalScore,
        0,
      );

      leaderboardEntries.push({
        userId: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        totalScore,
        rank: 0, // Will be calculated after sorting
      });
    }

    // Sort by totalScore descending and assign ranks
    leaderboardEntries.sort((a, b) => b.totalScore - a.totalScore);
    leaderboardEntries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Find current user's rank
    const currentUserEntry = leaderboardEntries.find(
      (entry) => entry.userId === userId,
    );
    const currentUserRank = currentUserEntry?.rank || 0;

    return {
      entries: leaderboardEntries,
      currentUserRank,
      weekStart: monday.toISOString(),
      weekEnd: nextMonday.toISOString(),
      grade: currentUser.grade,
    };
  }
}
