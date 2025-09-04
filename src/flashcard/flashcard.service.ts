import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../modules/prisma/prisma.service';
import { CreateFlashcardDto, UpdateFlashcardDto, FlashcardBulkCreateDto } from './dtos/flashcard.dto';

@Injectable()
export class FlashcardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createFlashcardDto: CreateFlashcardDto) {
    // Check if topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: createFlashcardDto.topicId },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${createFlashcardDto.topicId} not found`);
    }

    return this.prisma.flashcard.create({
      data: createFlashcardDto,
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
  }

  async createBulk(flashcardBulkCreateDto: FlashcardBulkCreateDto) {
    // Check if topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: flashcardBulkCreateDto.topicId },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${flashcardBulkCreateDto.topicId} not found`);
    }

    if (!flashcardBulkCreateDto.flashcards || flashcardBulkCreateDto.flashcards.length === 0) {
      throw new BadRequestException('Flashcards array cannot be empty');
    }

    // Prepare data with topicId
    const flashcardsData = flashcardBulkCreateDto.flashcards.map((flashcard, index) => ({
      ...flashcard,
      topicId: flashcardBulkCreateDto.topicId,
      order: flashcard.order ?? index,
    }));

    return this.prisma.$transaction(async (tx) => {
      const createdFlashcards = [];
      for (const flashcardData of flashcardsData) {
        const flashcard = await tx.flashcard.create({
          data: flashcardData,
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
        createdFlashcards.push(flashcard);
      }
      return createdFlashcards;
    });
  }

  async findAll(topicId?: number, isActive?: boolean, search?: string) {
    const where: any = {};

    if (topicId !== undefined) {
      where.topicId = topicId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { term: { contains: search, mode: 'insensitive' } },
        { meaningVi: { contains: search, mode: 'insensitive' } },
        { exampleEn: { contains: search, mode: 'insensitive' } },
        { exampleVi: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.flashcard.findMany({
      where,
      include: {
        topic: {
          select: {
            id: true,
            title: true,
            grade: true,
          },
        },
      },
      orderBy: [
        { topicId: 'asc' },
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
    });
  }

  async findByTopic(topicId: number, isActive?: boolean) {
    // Check if topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }

    const where: any = { topicId };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.flashcard.findMany({
      where,
      include: {
        topic: {
          select: {
            id: true,
            title: true,
            grade: true,
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
    });
  }

  async findOne(id: number) {
    const flashcard = await this.prisma.flashcard.findUnique({
      where: { id },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
            grade: true,
            description: true,
          },
        },
      },
    });

    if (!flashcard) {
      throw new NotFoundException(`Flashcard with ID ${id} not found`);
    }

    return flashcard;
  }

  async update(id: number, updateFlashcardDto: UpdateFlashcardDto) {
    // Check if flashcard exists
    await this.findOne(id);

    // If topicId is being updated, check if the new topic exists
    if (updateFlashcardDto.topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: updateFlashcardDto.topicId },
      });

      if (!topic) {
        throw new NotFoundException(`Topic with ID ${updateFlashcardDto.topicId} not found`);
      }
    }

    return this.prisma.flashcard.update({
      where: { id },
      data: updateFlashcardDto,
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
  }

  async remove(id: number) {
    // Check if flashcard exists
    await this.findOne(id);

    return this.prisma.flashcard.delete({
      where: { id },
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
  }

  async getFlashcardStats(topicId?: number) {
    const where: any = {};
    
    if (topicId !== undefined) {
      where.topicId = topicId;
    }

    const stats = await this.prisma.flashcard.groupBy({
      by: ['topicId', 'isActive'],
      where,
      _count: {
        id: true,
      },
    });

    const totalActive = stats
      .filter(stat => stat.isActive)
      .reduce((sum, stat) => sum + stat._count.id, 0);

    const totalInactive = stats
      .filter(stat => !stat.isActive)
      .reduce((sum, stat) => sum + stat._count.id, 0);

    return {
      totalFlashcards: totalActive + totalInactive,
      totalActive,
      totalInactive,
      byTopic: stats,
    };
  }

  async reorderFlashcards(topicId: number, flashcardIds: number[]) {
    // Check if topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }

    // Verify all flashcard IDs belong to the topic
    const flashcards = await this.prisma.flashcard.findMany({
      where: {
        id: { in: flashcardIds },
        topicId,
      },
    });

    if (flashcards.length !== flashcardIds.length) {
      throw new BadRequestException('Some flashcard IDs are invalid or do not belong to this topic');
    }

    // Update the order
    return this.prisma.$transaction(async (tx) => {
      const updatedFlashcards = [];
      for (let i = 0; i < flashcardIds.length; i++) {
        const updated = await tx.flashcard.update({
          where: { id: flashcardIds[i] },
          data: { order: i },
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
        updatedFlashcards.push(updated);
      }
      return updatedFlashcards;
    });
  }
}
