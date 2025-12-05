import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateFlashcardDto,
  UpdateFlashcardDto,
  FlashcardBulkCreateDto,
} from './dtos/index';
import * as XLSX from 'xlsx';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

@Injectable()
export class FlashcardService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Upload file to Cloudinary
   * Returns the secure URL of the uploaded file
   */
  private async uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
      if (file.mimetype.startsWith('image/')) {
        resourceType = 'image';
      } else if (
        file.mimetype.startsWith('audio/') ||
        file.mimetype.startsWith('video/')
      ) {
        resourceType = 'video';
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: 'flashcards',
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            reject(
              new BadRequestException(
                `Cloudinary upload failed: ${error.message}`,
              ),
            );
          } else if (result) {
            resolve(result.secure_url);
          } else {
            reject(
              new BadRequestException('Cloudinary upload failed: No result'),
            );
          }
        },
      );

      const bufferStream = Readable.from(file.buffer);
      bufferStream.pipe(uploadStream);
    });
  }

  async create(createFlashcardDto: CreateFlashcardDto) {
    // Check if topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: createFlashcardDto.topicId },
    });

    if (!topic) {
      throw new NotFoundException(
        `Topic with ID ${createFlashcardDto.topicId} not found`,
      );
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
      throw new NotFoundException(
        `Topic with ID ${flashcardBulkCreateDto.topicId} not found`,
      );
    }

    if (
      !flashcardBulkCreateDto.flashcards ||
      flashcardBulkCreateDto.flashcards.length === 0
    ) {
      throw new BadRequestException('Flashcards array cannot be empty');
    }

    // Get the current max order for this topic
    const maxOrderFlashcard = await this.prisma.flashcard.findFirst({
      where: { topicId: flashcardBulkCreateDto.topicId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const startOrder = maxOrderFlashcard ? maxOrderFlashcard.order + 1 : 0;

    // Prepare data with topicId and order
    let autoOrderCounter = startOrder;
    const flashcardsData = flashcardBulkCreateDto.flashcards.map(
      (flashcard) => {
        const orderValue =
          flashcard.order !== undefined && flashcard.order !== null
            ? flashcard.order
            : autoOrderCounter++;
        return {
          ...flashcard,
          topicId: flashcardBulkCreateDto.topicId,
          order: orderValue,
        };
      },
    );

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
    const where: Prisma.FlashcardWhereInput = {};

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
      orderBy: [{ topicId: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
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

    const where: Prisma.FlashcardWhereInput = { topicId };

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
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
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
        throw new NotFoundException(
          `Topic with ID ${updateFlashcardDto.topicId} not found`,
        );
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
    const where: Prisma.FlashcardWhereInput = {};

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
      .filter((stat) => stat.isActive)
      .reduce((sum, stat) => sum + stat._count.id, 0);

    const totalInactive = stats
      .filter((stat) => !stat.isActive)
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
      throw new BadRequestException(
        'Some flashcard IDs are invalid or do not belong to this topic',
      );
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

  async importFromExcel(
    topicId: number,
    buffer: Buffer,
    assetFiles: Express.Multer.File[] = [],
  ) {
    // Check if topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }

    try {
      // Step 1: Upload all assets to Cloudinary and create filename -> URL map
      const assetMap = new Map<string, string>();

      for (const file of assetFiles) {
        try {
          const uploadedUrl = await this.uploadToCloudinary(file);
          assetMap.set(file.originalname, uploadedUrl);
        } catch {
          // ignore upload failures for individual assets
        }
      }

      // Step 2: Parse Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new BadRequestException('Excel file is empty');
      }

      const worksheet = workbook.Sheets[sheetName];

      interface ExcelRow {
        term?: string | number;
        meaningVi?: string | number;
        phonetic?: string | number;
        ExEn?: string | number;
        ExVi?: string | number;
        img?: string | number;
        audio?: string | number;
        [key: string]: unknown;
      }

      const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
        defval: '',
      });

      if (!data || data.length === 0) {
        throw new BadRequestException('No data found in Excel file');
      }

      // Get the current max order for this topic
      const maxOrderFlashcard = await this.prisma.flashcard.findFirst({
        where: { topicId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const startOrder = maxOrderFlashcard ? maxOrderFlashcard.order + 1 : 0;

      // Helper function to extract filename from path
      const extractFileName = (path: string): string => {
        if (!path || typeof path !== 'string') return '';
        const normalized = path.trim();
        if (!normalized) return ''; // Handles empty strings and whitespace-only
        return normalized.split('\\').pop()?.split('/').pop() || '';
      };

      // Helper function to normalize cell value
      const normalizeValue = (value: unknown): string => {
        if (value === undefined || value === null) return '';
        if (typeof value === 'string') {
          const s = value.trim();
          if (!s) return ''; // Handles empty strings and whitespace-only
          return s;
        }
        if (typeof value === 'object') return '';
        if (typeof value === 'number' || typeof value === 'boolean') {
          return String(value).trim();
        }
        return '';
      };

      // Helper function to map file path to uploaded URL
      const mapAssetUrl = (cellValue: any): string => {
        if (!cellValue) return '';
        const path = normalizeValue(cellValue);
        if (!path) return '';

        const fileName = extractFileName(path);
        if (!fileName) return '';

        const uploadedUrl = assetMap.get(fileName);
        if (uploadedUrl) {
          return uploadedUrl;
        }
        return '';
      };

      // Map Excel rows to flashcard DTOs
      const flashcards: CreateFlashcardDto[] = data.map((row, index) => {
        const term = normalizeValue(row.term);
        const meaningVi = normalizeValue(row.meaningVi);

        // Validate required fields
        if (!term || !meaningVi) {
          throw new BadRequestException(
            `Row ${index + 2}: term and meaningVi are required`,
          );
        }

        return {
          topicId,
          term,
          phonetic: normalizeValue(row.phonetic),
          meaningVi,
          exampleEn: normalizeValue(row.ExEn),
          exampleVi: normalizeValue(row.ExVi),
          imageUrl: mapAssetUrl(row.img),
          audioUrl: mapAssetUrl(row.audio),
          order: startOrder + index,
          isActive: true,
        };
      });

      // Create flashcards in transaction with extended timeout for serverless
      const createdFlashcards = await this.prisma.$transaction(
        async (tx) => {
          const createdFlashcards = [];
          for (const flashcard of flashcards) {
            const created = await tx.flashcard.create({
              data: flashcard,
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
            createdFlashcards.push(created);
          }
          return createdFlashcards;
        },
        {
          maxWait: 15000, // 15 seconds
          timeout: 15000, // 15 seconds
        },
      );

      // Return lightweight summary instead of full data to avoid large response
      return {
        imported: createdFlashcards.length,
        flashcards: createdFlashcards.map((fc) => ({
          id: fc.id,
          term: fc.term,
          order: fc.order,
        })),
      };
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      const msg = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to parse Excel file: ${msg}`);
    }
  }
}
