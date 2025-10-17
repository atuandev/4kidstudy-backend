import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, SentenceImage, Sentence } from '@prisma/client';
import {
  CreateSentenceImageDto,
  CreateSentenceDto,
  UpdateSentenceImageDto,
  UpdateSentenceDto,
  CreateSentenceImageWithSentencesDto,
} from './dtos/index';

type SentenceImageWithSentences = SentenceImage & {
  sentences: Sentence[];
};

/**
 * Service for managing sentence images and sentences
 */
@Injectable()
export class SentenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all sentence images by topic ID with their associated sentences
   */
  async getSentenceImagesByTopicId(
    topicId: number,
    isActive?: boolean,
  ): Promise<SentenceImageWithSentences[]> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }
    const where: Prisma.SentenceImageWhereInput = { topicId };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    return this.prisma.sentenceImage.findMany({
      where,
      include: {
        sentences: {
          where: isActive !== undefined ? { isActive } : undefined,
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Get all sentence images with their associated sentences
   */
  async getAllSentenceImages(
    isActive?: boolean,
  ): Promise<SentenceImageWithSentences[]> {
    const where: Prisma.SentenceImageWhereInput = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    return this.prisma.sentenceImage.findMany({
      where,
      include: {
        sentences: {
          where: isActive !== undefined ? { isActive } : undefined,
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Create a new sentence image
   */
  async createSentenceImage(
    createSentenceImageDto: CreateSentenceImageDto,
  ): Promise<SentenceImageWithSentences> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: createSentenceImageDto.topicId },
    });
    if (!topic) {
      throw new NotFoundException(
        `Topic with ID ${createSentenceImageDto.topicId} not found`,
      );
    }
    return this.prisma.sentenceImage.create({
      data: createSentenceImageDto,
      include: {
        sentences: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * Create a sentence image with sentences in a single transaction
   */
  async createSentenceImageWithSentences(
    createDto: CreateSentenceImageWithSentencesDto,
  ): Promise<SentenceImageWithSentences> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: createDto.topicId },
    });
    if (!topic) {
      throw new NotFoundException(
        `Topic with ID ${createDto.topicId} not found`,
      );
    }
    if (!createDto.sentences || createDto.sentences.length === 0) {
      throw new BadRequestException('At least one sentence is required');
    }
    return this.prisma.$transaction(async (tx) => {
      const sentenceImage = await tx.sentenceImage.create({
        data: {
          topicId: createDto.topicId,
          imageUrl: createDto.imageUrl,
          audioUrl: createDto.audioUrl,
          order: createDto.order ?? 0,
          isActive: createDto.isActive ?? true,
        },
      });
      const sentences = await Promise.all(
        createDto.sentences.map((sentence, index) =>
          tx.sentence.create({
            data: {
              sentenceImageId: sentenceImage.id,
              text: sentence.text,
              meaningVi: sentence.meaningVi,
              hintVi: sentence.hintVi,
              audioUrl: sentence.audioUrl,
              order: sentence.order ?? index,
              isActive: sentence.isActive ?? true,
            },
          }),
        ),
      );
      return {
        ...sentenceImage,
        sentences,
      };
    });
  }

  /**
   * Create a new sentence
   */
  async createSentence(
    createSentenceDto: CreateSentenceDto,
  ): Promise<Sentence> {
    const sentenceImage = await this.prisma.sentenceImage.findUnique({
      where: { id: createSentenceDto.sentenceImageId },
    });
    if (!sentenceImage) {
      throw new NotFoundException(
        `Sentence image with ID ${createSentenceDto.sentenceImageId} not found`,
      );
    }
    return this.prisma.sentence.create({
      data: createSentenceDto,
    });
  }

  /**
   * Get a sentence image by ID with its sentences
   */
  async getSentenceImageById(id: number): Promise<SentenceImageWithSentences> {
    const sentenceImage = await this.prisma.sentenceImage.findUnique({
      where: { id },
      include: {
        sentences: {
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!sentenceImage) {
      throw new NotFoundException(`Sentence image with ID ${id} not found`);
    }
    return sentenceImage;
  }

  /**
   * Get a sentence by ID
   */
  async getSentenceById(id: number): Promise<Sentence> {
    const sentence = await this.prisma.sentence.findUnique({
      where: { id },
    });
    if (!sentence) {
      throw new NotFoundException(`Sentence with ID ${id} not found`);
    }
    return sentence;
  }

  /**
   * Update a sentence image
   */
  async updateSentenceImage(
    id: number,
    updateSentenceImageDto: UpdateSentenceImageDto,
  ): Promise<SentenceImageWithSentences> {
    await this.getSentenceImageById(id);
    if (updateSentenceImageDto.topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: updateSentenceImageDto.topicId },
      });
      if (!topic) {
        throw new NotFoundException(
          `Topic with ID ${updateSentenceImageDto.topicId} not found`,
        );
      }
    }
    return this.prisma.sentenceImage.update({
      where: { id },
      data: updateSentenceImageDto,
      include: {
        sentences: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * Update a sentence
   */
  async updateSentence(
    id: number,
    updateSentenceDto: UpdateSentenceDto,
  ): Promise<Sentence> {
    await this.getSentenceById(id);
    if (updateSentenceDto.sentenceImageId) {
      const sentenceImage = await this.prisma.sentenceImage.findUnique({
        where: { id: updateSentenceDto.sentenceImageId },
      });
      if (!sentenceImage) {
        throw new NotFoundException(
          `Sentence image with ID ${updateSentenceDto.sentenceImageId} not found`,
        );
      }
    }
    return this.prisma.sentence.update({
      where: { id },
      data: updateSentenceDto,
    });
  }

  /**
   * Delete a sentence image
   */
  async deleteSentenceImage(id: number): Promise<SentenceImageWithSentences> {
    await this.getSentenceImageById(id);
    return this.prisma.sentenceImage.delete({
      where: { id },
      include: {
        sentences: true,
      },
    });
  }

  /**
   * Delete a sentence
   */
  async deleteSentence(id: number): Promise<Sentence> {
    await this.getSentenceById(id);
    return this.prisma.sentence.delete({
      where: { id },
    });
  }
}
