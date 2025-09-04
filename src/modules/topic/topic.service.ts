import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTopicDto, UpdateTopicDto, GradeLevel } from './dtos/topic.dto';

@Injectable()
export class TopicService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTopicDto: CreateTopicDto) {
    return this.prisma.topic.create({
      data: createTopicDto,
    });
  }

  async findAll(grade?: GradeLevel, isActive?: boolean) {
    const where: Prisma.TopicWhereInput = {};

    if (grade !== undefined) {
      where.grade = grade;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.topic.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            status: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
        flashcards: {
          select: {
            id: true,
            term: true,
            meaningVi: true,
          },
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            lessons: true,
            flashcards: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            order: true,
            coverImage: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { order: 'asc' },
        },
        flashcards: {
          select: {
            id: true,
            term: true,
            phonetic: true,
            meaningVi: true,
            exampleEn: true,
            exampleVi: true,
            imageUrl: true,
            audioUrl: true,
            order: true,
          },
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            lessons: true,
            flashcards: true,
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    return topic;
  }

  async update(id: number, updateTopicDto: UpdateTopicDto) {
    // Check if topic exists
    await this.findOne(id);

    return this.prisma.topic.update({
      where: { id },
      data: updateTopicDto,
    });
  }

  async remove(id: number) {
    // Check if topic exists
    await this.findOne(id);

    return this.prisma.topic.delete({
      where: { id },
    });
  }

  async getTopicStats(id: number) {
    const topic = await this.findOne(id);

    const stats = await this.prisma.topic.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            lessons: true,
            flashcards: {
              where: { isActive: true },
            },
          },
        },
        lessons: {
          select: {
            _count: {
              select: {
                exercises: true,
                attempts: true,
              },
            },
          },
        },
      },
    });

    const totalExercises = (stats?.lessons ?? []).reduce(
      (sum: number, lesson) => sum + lesson._count.exercises,
      0,
    );

    const totalAttempts = (stats?.lessons ?? []).reduce(
      (sum: number, lesson) => sum + lesson._count.attempts,
      0,
    );

    return {
      topicId: topic.id,
      title: topic.title,
      grade: topic.grade,
      totalLessons: stats?._count?.lessons ?? 0,
      totalFlashcards: stats?._count?.flashcards ?? 0,
      totalExercises,
      totalAttempts,
    };
  }
}
