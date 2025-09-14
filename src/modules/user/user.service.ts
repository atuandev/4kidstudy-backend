import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        dob: true,
        gender: true,
        xp: true,
        streakDays: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Exclude sensitive info like passwordHash
        _count: {
          select: {
            attempts: true,
            xpLogs: true,
            streakLogs: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Convert null values to undefined for proper DTO mapping
    return {
      ...user,
      avatarUrl: user.avatarUrl || undefined,
      dob: user.dob || undefined,
    };
  }

  async findProfileStatistics(id: number) {
    // Check if user exists
    await this.findById(id);

    // Get learning statistics
    const learningStats = await this.prisma.$transaction(async (tx) => {
      // Get total lesson attempts
      const totalAttempts = await tx.attempt.count({
        where: { userId: id },
      });

      // Get completed lessons
      const completedLessons = await tx.attempt.count({
        where: { 
          userId: id,
          completedAt: { not: null },
        },
      });

      // Get total XP
      const user = await tx.user.findUnique({
        where: { id },
        select: { xp: true, streakDays: true },
      });

      // Get streak information
      const currentStreak = user?.streakDays || 0;

      // Get best day XP
      const bestDay = await tx.streakLog.findFirst({
        where: { userId: id },
        orderBy: { xpEarned: 'desc' },
        select: { day: true, xpEarned: true },
      });

      return {
        totalAttempts,
        completedLessons,
        totalXp: user?.xp || 0,
        currentStreak,
        bestDayXp: bestDay?.xpEarned || 0,
        bestDay: bestDay?.day || null,
      };
    });

    return learningStats;
  }
}
