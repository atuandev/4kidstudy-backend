import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLessonDto,
  UpdateLessonDto,
  LessonBulkCreateDto,
} from './dto/index';
import { Lesson, Prisma } from '@prisma/client';

@Injectable()
export class LessonService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    topicId?: number;
    status?: string;
  }): Promise<Lesson[]> {
    const { skip, take, topicId, status } = params;
    const where: Prisma.LessonWhereInput = {};

    if (topicId) {
      where.topicId = topicId;
    }

    if (status) {
      where.status = status as any;
    }

    return this.prisma.lesson.findMany({
      where,
      skip,
      take,
      include: {
        topic: true,
        _count: {
          select: {
            exercises: true,
          },
        },
      },
      orderBy: [
        {
          topicId: 'asc',
        },
        {
          order: 'asc',
        },
      ],
    });
  }

  async findById(id: number): Promise<Lesson> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        topic: true,
        exercises: {
          include: {
            options: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    return lesson;
  }

  async create(data: CreateLessonDto): Promise<Lesson> {
    // Check if topic exists
    const topicExists = await this.prisma.topic.findUnique({
      where: { id: data.topicId },
    });

    if (!topicExists) {
      throw new NotFoundException(`Topic with ID ${data.topicId} not found`);
    }

    // Determine order if not provided
    if (!data.order) {
      const maxOrder = await this.prisma.lesson.findFirst({
        where: { topicId: data.topicId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      data.order = maxOrder ? maxOrder.order + 1 : 1;
    }

    return this.prisma.lesson.create({
      data,
      include: {
        topic: true,
      },
    });
  }

  async createBulk(lessonBulkCreateDto: LessonBulkCreateDto) {
    // Check if topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: lessonBulkCreateDto.topicId },
    });

    if (!topic) {
      throw new NotFoundException(
        `Topic with ID ${lessonBulkCreateDto.topicId} not found`,
      );
    }

    if (
      !lessonBulkCreateDto.lessons ||
      lessonBulkCreateDto.lessons.length === 0
    ) {
      throw new BadRequestException('Lessons array cannot be empty');
    }

    // Get the current max order for this topic
    const maxOrderLesson = await this.prisma.lesson.findFirst({
      where: { topicId: lessonBulkCreateDto.topicId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const startOrder = maxOrderLesson ? maxOrderLesson.order + 1 : 1;

    // Prepare data with topicId
    const lessonsData = lessonBulkCreateDto.lessons.map((lesson, index) => ({
      ...lesson,
      topicId: lessonBulkCreateDto.topicId,
      order: lesson.order ?? startOrder + index,
    }));

    return this.prisma.$transaction(async (tx) => {
      const createdLessons = [];
      for (const lessonData of lessonsData) {
        const lesson = await tx.lesson.create({
          data: lessonData,
          include: {
            topic: {
              select: {
                id: true,
                title: true,
                grade: true,
              },
            },
          },
        });
        createdLessons.push(lesson);
      }
      return createdLessons;
    });
  }

  async update(id: number, data: UpdateLessonDto): Promise<Lesson> {
    // Check if the lesson exists
    await this.findById(id);

    return this.prisma.lesson.update({
      where: { id },
      data,
      include: {
        topic: true,
      },
    });
  }

  async delete(id: number): Promise<Lesson> {
    // Check if the lesson exists
    await this.findById(id);

    return this.prisma.lesson.delete({
      where: { id },
      include: {
        topic: true,
      },
    });
  }
}
