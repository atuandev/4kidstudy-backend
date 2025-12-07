import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Prisma,
  SentenceImage,
  Sentence,
  LearningProgress,
} from '@prisma/client';
import {
  CreateSentenceImageDto,
  CreateSentenceDto,
  UpdateSentenceImageDto,
  UpdateSentenceDto,
  CreateSentenceImageWithSentencesDto,
  SentenceBulkCreateDto,
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

type SentenceImageWithSentences = SentenceImage & {
  sentences: (Sentence & {
    progress?: LearningProgress[];
  })[];
};

/**
 * Service for managing sentence images and sentences
 */
@Injectable()
export class SentenceService {
  constructor(private readonly prisma: PrismaService) { }

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
          include: {
            progress: true,
          },
        },
        topic: true,
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
          include: {
            progress: true,
          },
        },
        topic: true,
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
        topic: true,
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
        include: { topic: true },
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
   * Create multiple sentence images with sentences in bulk
   */
  async createBulk(
    sentenceBulkCreateDto: SentenceBulkCreateDto,
  ): Promise<SentenceImageWithSentences[]> {
    // Check if topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: sentenceBulkCreateDto.topicId },
    });

    if (!topic) {
      throw new NotFoundException(
        `Topic with ID ${sentenceBulkCreateDto.topicId} not found`,
      );
    }

    if (
      !sentenceBulkCreateDto.sentenceImages ||
      sentenceBulkCreateDto.sentenceImages.length === 0
    ) {
      throw new BadRequestException('Sentence images array cannot be empty');
    }

    // Get the current max order for this topic
    const maxOrderSentenceImage = await this.prisma.sentenceImage.findFirst({
      where: { topicId: sentenceBulkCreateDto.topicId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const startOrder = maxOrderSentenceImage
      ? maxOrderSentenceImage.order + 1
      : 0;

    return this.prisma.$transaction(async (tx) => {
      const createdSentenceImages: SentenceImageWithSentences[] = [];

      for (const [
        index,
        sentenceImageData,
      ] of sentenceBulkCreateDto.sentenceImages.entries()) {
        // Create sentence image
        const sentenceImage = await tx.sentenceImage.create({
          data: {
            topicId: sentenceBulkCreateDto.topicId,
            imageUrl: sentenceImageData.imageUrl,
            audioUrl: sentenceImageData.audioUrl,
            order: sentenceImageData.order ?? startOrder + index,
            isActive: sentenceImageData.isActive ?? true,
          },
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

        // Create sentences for this image
        let sentenceOrderCounter = 0;
        const sentences = await Promise.all(
          (sentenceImageData.sentences || []).map((sentence) => {
            const orderValue =
              sentence.order !== undefined && sentence.order !== null
                ? sentence.order
                : sentenceOrderCounter++;
            return tx.sentence.create({
              data: {
                sentenceImageId: sentenceImage.id,
                text: sentence.text,
                meaningVi: sentence.meaningVi,
                hintVi: sentence.hintVi,
                audioUrl: sentence.audioUrl,
                order: orderValue,
                isActive: sentence.isActive ?? true,
              },
            });
          }),
        );

        createdSentenceImages.push({
          ...sentenceImage,
          sentences,
        });
      }

      return createdSentenceImages;
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
          include: {
            progress: true,
          },
        },
        topic: true,
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
        topic: true,
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

    // Extract resetProgress from DTO
    const { resetProgress, ...updateData } = updateSentenceDto;

    // If resetProgress is true, delete all learning progress for this sentence
    if (resetProgress) {
      await this.prisma.learningProgress.deleteMany({
        where: {
          sentenceId: id,
          contentType: 'SENTENCE',
        },
      });
    }

    return this.prisma.sentence.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Soft delete a sentence image (set isActive = false)
   */
  async deleteSentenceImage(id: number): Promise<SentenceImageWithSentences> {
    await this.getSentenceImageById(id);
    return this.prisma.sentenceImage.update({
      where: { id },
      data: { isActive: false },
      include: {
        sentences: true,
        topic: true,
      },
    });
  }

  /**
   * Soft delete a sentence (set isActive = false)
   */
  async deleteSentence(id: number): Promise<Sentence> {
    await this.getSentenceById(id);
    return this.prisma.sentence.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Check if sentences have learning progress
   */
  async checkProgress(sentenceIds: number[]) {
    const sentences = await this.prisma.sentence.findMany({
      where: {
        id: { in: sentenceIds },
      },
      include: {
        progress: {
          where: {
            contentType: 'SENTENCE',
          },
          select: {
            id: true,
            userId: true,
            reviewCount: true,
            isMastered: true,
            lastReviewedAt: true,
          },
        },
      },
    });

    return sentences.map((sentence) => ({
      id: sentence.id,
      text: sentence.text,
      hasProgress: sentence.progress.length > 0,
      progressCount: sentence.progress.length,
      masteredCount: sentence.progress.filter((p) => p.isMastered).length,
    }));
  }

  /**
   * Check if sentence image has learning progress before delete
   */
  async checkSentenceImageProgressForDelete(id: number) {
    const sentenceImage = await this.prisma.sentenceImage.findUnique({
      where: { id },
      include: {
        sentences: {
          include: {
            progress: {
              where: {
                contentType: 'SENTENCE',
              },
            },
          },
        },
      },
    });

    if (!sentenceImage) {
      throw new NotFoundException(`Sentence image with ID ${id} not found`);
    }

    const totalProgress = sentenceImage.sentences.reduce(
      (sum, sentence) => sum + sentence.progress.length,
      0,
    );
    const totalMastered = sentenceImage.sentences.reduce(
      (sum, sentence) =>
        sum + sentence.progress.filter((p) => p.isMastered).length,
      0,
    );

    return {
      id: sentenceImage.id,
      hasProgress: totalProgress > 0,
      progressCount: totalProgress,
      masteredCount: totalMastered,
      sentenceCount: sentenceImage.sentences.length,
    };
  }

  /**
   * Check if sentence has learning progress before delete
   */
  async checkSentenceProgressForDelete(id: number) {
    const sentence = await this.prisma.sentence.findUnique({
      where: { id },
      include: {
        progress: {
          where: {
            contentType: 'SENTENCE',
          },
        },
      },
    });

    if (!sentence) {
      throw new NotFoundException(`Sentence with ID ${id} not found`);
    }

    return {
      id: sentence.id,
      text: sentence.text,
      hasProgress: sentence.progress.length > 0,
      progressCount: sentence.progress.length,
      masteredCount: sentence.progress.filter((p) => p.isMastered).length,
    };
  }

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
          folder: 'sentences',
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

  /**
   * Import sentences from Excel file
   * One Excel row creates one SentenceImage with 1-4 Sentence records
   */
  async importFromExcel(
    topicId: number,
    buffer: Buffer,
    assetFiles: Express.Multer.File[] = [],
  ): Promise<{
    created: number;
    sentenceImages: Array<{
      id: number;
      order: number;
      sentenceCount: number;
    }>;
  }> {
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

      console.log(`📦 Received ${assetFiles.length} asset files to upload`);

      for (const file of assetFiles) {
        try {
          console.log(`⬆️  Uploading: ${file.originalname}`);
          const uploadedUrl = await this.uploadToCloudinary(file);
          assetMap.set(file.originalname, uploadedUrl);
          console.log(`✅ Uploaded: ${file.originalname} -> ${uploadedUrl}`);
        } catch (error) {
          console.error(`❌ Failed to upload ${file.originalname}:`, error);
          // ignore upload failures for individual assets
        }
      }

      console.log(
        `📊 Asset map has ${assetMap.size} entries:`,
        Array.from(assetMap.keys()),
      );

      // Step 2: Parse Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new BadRequestException('Excel file is empty');
      }

      const worksheet = workbook.Sheets[sheetName];

      interface ExcelRow {
        imgSentence?: string | number;
        audioImg?: string | number;
        sen01?: string | number;
        sen01Vi?: string | number;
        sen01audio?: string | number;
        sen02?: string | number;
        sen02Vi?: string | number;
        sen02audio?: string | number;
        sen03?: string | number;
        sen03Vi?: string | number;
        sen03audio?: string | number;
        sen04?: string | number;
        sen04Vi?: string | number;
        sen04audio?: string | number;
        [key: string]: unknown;
      }

      // Parse Excel with default empty string for missing cells
      const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
      });

      if (!data || data.length === 0) {
        throw new BadRequestException('No data found in Excel file');
      }

      console.log(`📊 Found ${data.length} rows in Excel`);

      // Get the current max order for this topic
      const maxOrderSentenceImage = await this.prisma.sentenceImage.findFirst({
        where: { topicId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const startOrder = maxOrderSentenceImage
        ? maxOrderSentenceImage.order + 1
        : 0;

      // Helper function to normalize values
      const normalizeValue = (
        val: string | number | null | undefined,
      ): string => {
        if (val === null || val === undefined) return '';
        const str = String(val).trim();
        // Treat '\n' as null/empty
        if (str === '\\n' || str === '\n') return '';
        return str;
      };

      // Helper function to map asset filename to URL
      const mapAssetUrl = (
        filename: string | number | null | undefined,
      ): string | null => {
        const normalized = normalizeValue(filename);
        if (!normalized) return null;

        // Extract just the filename if path is provided
        const name = normalized.split(/[/\\]/).pop() || normalized;

        const url = assetMap.get(name);
        if (url) {
          return url;
        }

        // Try case-insensitive search
        for (const [key, value] of assetMap.entries()) {
          if (key.toLowerCase() === name.toLowerCase()) {
            return value;
          }
        }

        console.warn(`⚠️  Asset not found for: ${normalized}`);
        return null;
      };

      // Step 3: Create SentenceImage and Sentence records in transaction
      const createdSentenceImages: SentenceImageWithSentences[] = [];

      // Use longer timeout for serverless environments (Vercel)
      await this.prisma.$transaction(
        async (tx) => {
          for (const [index, row] of data.entries()) {
            const rowNum = index + 1;

            // Get SentenceImage fields
            const imageUrl = mapAssetUrl(row.imgSentence);
            const audioUrl = mapAssetUrl(row.audioImg);

            if (!imageUrl) {
              console.warn(
                `⚠️  Row ${rowNum}: Missing imgSentence, skipping...`,
              );
              continue;
            }

            // Create SentenceImage
            const sentenceImage = await tx.sentenceImage.create({
              data: {
                topicId,
                imageUrl,
                audioUrl,
                order: startOrder + index,
                isActive: true,
              },
              include: {
                topic: true,
              },
            });

            // Collect sentences (sen01-04)
            const sentencesData: Array<{
              text: string;
              meaningVi: string | null;
              audioUrl: string | null;
              order: number;
            }> = [];

            for (let i = 1; i <= 4; i++) {
              const senKey = `sen0${i}`;
              const senViKey = `sen0${i}Vi`;
              const senAudioKey = `sen0${i}audio`;

              const text = normalizeValue(
                row[senKey] as string | number | undefined,
              );
              if (!text) continue; // Skip empty sentence

              const meaningVi =
                normalizeValue(row[senViKey] as string | number | undefined) ||
                null;
              const audioUrl = mapAssetUrl(
                row[senAudioKey] as string | number | undefined,
              );

              sentencesData.push({
                text,
                meaningVi,
                audioUrl,
                order: i - 1,
              });
            }

            console.log(
              `📝 Row ${rowNum}: Creating SentenceImage with ${sentencesData.length} sentences`,
            );

            // Create all sentences for this SentenceImage
            const sentences = await Promise.all(
              sentencesData.map((sentenceData) =>
                tx.sentence.create({
                  data: {
                    sentenceImageId: sentenceImage.id,
                    text: sentenceData.text,
                    meaningVi: sentenceData.meaningVi,
                    hintVi: null,
                    audioUrl: sentenceData.audioUrl,
                    order: sentenceData.order,
                    isActive: true,
                  },
                }),
              ),
            );

            createdSentenceImages.push({
              ...sentenceImage,
              sentences,
            });
          }
        },
        {
          maxWait: 15000, // 15 seconds
          timeout: 15000, // 15 seconds
        },
      );

      console.log(
        `✅ Import completed: ${createdSentenceImages.length} SentenceImages created`,
      );

      // Return lightweight summary to avoid large response
      return {
        created: createdSentenceImages.length,
        sentenceImages: createdSentenceImages.map((img) => ({
          id: img.id,
          order: img.order,
          sentenceCount: img.sentences.length,
        })),
      };
    } catch (error) {
      console.error('❌ Import failed:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to import Excel: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
