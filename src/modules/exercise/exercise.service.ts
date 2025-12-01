import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExerciseDto,
  CreateManyExercisesDto,
  CreateOptionDto,
  UpdateExerciseDto,
  UpdateOptionDto,
  ImportCsvResponseDto,
} from './dto/index';
import { ExerciseType } from '@prisma/client';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CsvRow {
  [key: string]: string;
}

@Injectable()
export class ExerciseService {
  constructor(private prisma: PrismaService) {}

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
          folder: 'exercises',
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

  async findAll(lessonId?: number, type?: ExerciseType) {
    const where: {
      lessonId?: number;
      type?: ExerciseType;
    } = {};

    if (lessonId) {
      where.lessonId = lessonId;
    }

    if (type) {
      where.type = type;
    }

    return this.prisma.exercise.findMany({
      where,
      include: {
        options: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }

    return exercise;
  }

  async getExerciseOptions(exerciseId: number) {
    // First verify the exercise exists
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${exerciseId} not found`);
    }

    // Get all options for this exercise
    return this.prisma.exerciseOption.findMany({
      where: { exerciseId },
      orderBy: {
        order: 'asc',
      },
    });
  }

  async create(createExerciseDto: CreateExerciseDto) {
    // Check if lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: createExerciseDto.lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(
        `Lesson with ID ${createExerciseDto.lessonId} not found`,
      );
    }

    // Get the highest order number and add 1 for the new exercise
    const lastExercise = await this.prisma.exercise.findFirst({
      where: { lessonId: createExerciseDto.lessonId },
      orderBy: { order: 'desc' },
    });

    const newOrder = lastExercise ? lastExercise.order + 1 : 0;

    // Extract options from DTO
    const { options, ...exerciseData } = createExerciseDto;

    return this.prisma.$transaction(async (tx) => {
      // Create the exercise
      const exercise = await tx.exercise.create({
        data: {
          ...exerciseData,
          order: createExerciseDto.order ?? newOrder,
        },
      });

      // Create options if provided
      if (options && options.length > 0) {
        await Promise.all(
          options.map((option, index) =>
            tx.exerciseOption.create({
              data: {
                exerciseId: exercise.id,
                text: option.text,
                imageUrl: option.imageUrl,
                audioUrl: option.audioUrl,
                isCorrect: option.isCorrect,
                matchKey: option.matchKey,
                order: option.order ?? index,
              },
            }),
          ),
        );
      }

      // Return the created exercise with its options
      return tx.exercise.findUnique({
        where: { id: exercise.id },
        include: {
          options: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });
    });
  }

  /**
   * Create multiple exercises at once
   * @param createManyDto - DTO containing array of exercises to create
   * @returns Array of created exercises with their options
   */
  async createMany(createManyDto: CreateManyExercisesDto) {
    const exercises: CreateExerciseDto[] = createManyDto.exercises;

    if (!exercises || exercises.length === 0) {
      throw new BadRequestException('No exercises provided');
    }

    // Get all unique lesson IDs and validate they exist
    const lessonIds = [
      ...new Set(exercises.map((exercise) => exercise.lessonId)),
    ];
    const lessons = await this.prisma.lesson.findMany({
      where: { id: { in: lessonIds } },
    });

    if (lessons.length !== lessonIds.length) {
      const foundIds = new Set(lessons.map((lesson) => lesson.id));
      const missingIds = lessonIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Lessons with IDs ${missingIds.join(', ')} not found`,
      );
    }

    // Group exercises by lessonId to handle ordering
    const exercisesByLesson: Record<number, CreateExerciseDto[]> = {};
    for (const exercise of exercises) {
      if (!exercisesByLesson[exercise.lessonId]) {
        exercisesByLesson[exercise.lessonId] = [];
      }
      exercisesByLesson[exercise.lessonId].push(exercise);
    }

    // Get the current max order for each lesson
    const maxOrdersByLesson: Record<number, number> = {};
    for (const lessonId of lessonIds) {
      const lastExercise = await this.prisma.exercise.findFirst({
        where: { lessonId },
        orderBy: { order: 'desc' },
      });
      maxOrdersByLesson[lessonId] = lastExercise ? lastExercise.order + 1 : 0;
    }

    return this.prisma.$transaction(async (tx) => {
      const createdExercises = [];

      // Process exercises by lesson to maintain proper ordering
      for (const lessonId of lessonIds) {
        const lessonExercises = exercisesByLesson[lessonId];
        let currentOrder = maxOrdersByLesson[lessonId];

        for (const exerciseDto of lessonExercises) {
          const { options, ...exerciseData } = exerciseDto;

          // Create the exercise
          const exercise = await tx.exercise.create({
            data: {
              ...exerciseData,
              order: exerciseDto.order ?? currentOrder++,
            },
          });

          // Create options if provided
          if (options && options.length > 0) {
            await Promise.all(
              options.map((option, index) =>
                tx.exerciseOption.create({
                  data: {
                    exerciseId: exercise.id,
                    text: option.text,
                    imageUrl: option.imageUrl,
                    audioUrl: option.audioUrl,
                    isCorrect: option.isCorrect,
                    matchKey: option.matchKey,
                    order: option.order ?? index,
                  },
                }),
              ),
            );
          }

          // Fetch the created exercise with options
          const createdExercise = await tx.exercise.findUnique({
            where: { id: exercise.id },
            include: {
              options: {
                orderBy: {
                  order: 'asc',
                },
              },
            },
          });

          if (createdExercise) {
            createdExercises.push(createdExercise);
          }
        }
      }

      return createdExercises;
    });
  }

  async update(id: number, updateExerciseDto: UpdateExerciseDto) {
    // Check if exercise exists
    await this.findOne(id);

    // Extract options from DTO
    const { options, ...exerciseData } = updateExerciseDto;

    // Check if lessonId is being updated and if it exists
    if (exerciseData.lessonId) {
      const lessonExists = await this.prisma.lesson.findUnique({
        where: { id: exerciseData.lessonId },
      });

      if (!lessonExists) {
        throw new NotFoundException(
          `Lesson with ID ${exerciseData.lessonId} not found`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Update the exercise properties only
      await tx.exercise.update({
        where: { id },
        data: exerciseData,
      });

      // Only process options if they are explicitly included in the request
      // This allows updating just the exercise properties without touching options
      if (options && options.length > 0) {
        // Process options - create new ones, update existing ones
        for (const option of options) {
          if (option.id) {
            // Update existing option
            await tx.exerciseOption.update({
              where: { id: option.id },
              data: {
                text: option.text,
                imageUrl: option.imageUrl,
                audioUrl: option.audioUrl,
                isCorrect: option.isCorrect,
                matchKey: option.matchKey,
                order: option.order,
              },
            });
          } else {
            // If order is provided, check if it already exists
            if (option.order !== undefined) {
              const existingOption = await tx.exerciseOption.findFirst({
                where: {
                  exerciseId: id,
                  order: option.order,
                },
              });

              if (existingOption) {
                throw new BadRequestException(
                  `An option with order ${option.order} already exists in this exercise`,
                );
              }
            } else {
              // If no order provided, get highest order + 1
              const lastOption = await tx.exerciseOption.findFirst({
                where: { exerciseId: id },
                orderBy: { order: 'desc' },
              });
              option.order = lastOption ? lastOption.order + 1 : 0;
            }

            // Create new option
            await tx.exerciseOption.create({
              data: {
                exerciseId: id,
                text: option.text,
                imageUrl: option.imageUrl,
                audioUrl: option.audioUrl,
                isCorrect: option.isCorrect,
                matchKey: option.matchKey,
                order: option.order,
              },
            });
          }
        }
      }

      // Return the updated exercise with its options
      return tx.exercise.findUnique({
        where: { id },
        include: {
          options: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });
    });
  }

  async delete(id: number) {
    // Check if exercise exists
    await this.findOne(id);

    // Delete exercise (will cascade to options due to Prisma schema)
    return this.prisma.exercise.delete({
      where: { id },
    });
  }

  async createOption(exerciseId: number, createOptionDto: CreateOptionDto) {
    // Check if exercise exists
    await this.findOne(exerciseId);

    // If order is provided, check if it already exists
    if (createOptionDto.order !== undefined) {
      const existingOption = await this.prisma.exerciseOption.findFirst({
        where: {
          exerciseId,
          order: createOptionDto.order,
        },
      });

      if (existingOption) {
        throw new BadRequestException(
          `An option with order ${createOptionDto.order} already exists in this exercise`,
        );
      }
    } else {
      // Get the highest order number and add 1 for the new option
      const lastOption = await this.prisma.exerciseOption.findFirst({
        where: { exerciseId },
        orderBy: { order: 'desc' },
      });

      createOptionDto.order = lastOption ? lastOption.order + 1 : 0;
    }

    // Create the option
    return this.prisma.exerciseOption.create({
      data: {
        exerciseId,
        text: createOptionDto.text,
        imageUrl: createOptionDto.imageUrl,
        audioUrl: createOptionDto.audioUrl,
        isCorrect: createOptionDto.isCorrect,
        matchKey: createOptionDto.matchKey,
        order: createOptionDto.order,
      },
    });
  }

  async updateOption(id: number, updateOptionDto: UpdateOptionDto) {
    // Check if option exists
    const option = await this.prisma.exerciseOption.findUnique({
      where: { id },
    });

    if (!option) {
      throw new NotFoundException(`Option with ID ${id} not found`);
    }

    // If order is being updated, check for conflicts
    if (
      updateOptionDto.order !== undefined &&
      updateOptionDto.order !== option.order
    ) {
      const existingOption = await this.prisma.exerciseOption.findFirst({
        where: {
          exerciseId: option.exerciseId,
          order: updateOptionDto.order,
          id: { not: id }, // Exclude the current option
        },
      });

      if (existingOption) {
        throw new BadRequestException(
          `Another option with order ${updateOptionDto.order} already exists in this exercise`,
        );
      }
    }

    // Update the option
    return this.prisma.exerciseOption.update({
      where: { id },
      data: updateOptionDto,
    });
  }

  async deleteOption(id: number) {
    // Check if option exists
    const option = await this.prisma.exerciseOption.findUnique({
      where: { id },
    });

    if (!option) {
      throw new NotFoundException(`Option with ID ${id} not found`);
    }

    // Delete the option
    return this.prisma.exerciseOption.delete({
      where: { id },
    });
  }

  async reorderExercises(lessonId: number, exerciseIds: number[]) {
    // Check if all exercises exist and belong to the lesson
    const exercises = await this.prisma.exercise.findMany({
      where: {
        id: { in: exerciseIds },
        lessonId,
      },
    });

    if (exercises.length !== exerciseIds.length) {
      throw new BadRequestException(
        'Some exercises do not exist or do not belong to the specified lesson',
      );
    }

    // Update order of each exercise
    await Promise.all(
      exerciseIds.map((id, index) =>
        this.prisma.exercise.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    // Return the reordered exercises
    return this.prisma.exercise.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async reorderOptions(exerciseId: number, optionIds: number[]) {
    // Check if all options exist and belong to the exercise
    const options = await this.prisma.exerciseOption.findMany({
      where: {
        id: { in: optionIds },
        exerciseId,
      },
    });

    if (options.length !== optionIds.length) {
      throw new BadRequestException(
        'Some options do not exist or do not belong to the specified exercise',
      );
    }

    // Update order of each option
    await Promise.all(
      optionIds.map((id, index) =>
        this.prisma.exerciseOption.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    // Return the reordered options
    return this.prisma.exerciseOption.findMany({
      where: { exerciseId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Import exercises and/or options from CSV files
   */
  async importFromCsv(
    lessonId: number,
    exercisesFile?: Express.Multer.File,
    optionsFile?: Express.Multer.File,
  ): Promise<ImportCsvResponseDto> {
    // Verify lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    const response: ImportCsvResponseDto = {
      success: true,
      exercises: { created: 0, skipped: 0, failed: 0, errors: [] },
      options: { created: 0, skipped: 0, failed: 0, errors: [] },
    };

    // Map CSV exercise ID to database exercise ID
    const exerciseIdMap = new Map<number, number>();

    // Import exercises if file provided
    if (exercisesFile) {
      const { stats, idMap } = await this.importExercises(
        lessonId,
        exercisesFile.buffer,
      );
      response.exercises = stats;
      // Store the ID mapping for options import
      idMap.forEach((dbId, csvId) => {
        exerciseIdMap.set(csvId, dbId);
      });
    }

    // Import options if file provided
    if (optionsFile) {
      const optionsResult = await this.importOptions(
        optionsFile.buffer,
        exerciseIdMap,
      );
      response.options = optionsResult;
    }

    // Set overall success based on failures
    response.success =
      response.exercises.failed === 0 && response.options.failed === 0;

    response.message = `Import completed. Exercises: ${response.exercises.created} created, ${response.exercises.skipped} skipped, ${response.exercises.failed} failed. Options: ${response.options.created} created, ${response.options.skipped} skipped, ${response.options.failed} failed.`;

    return response;
  }

  /**
   * Parse CSV buffer and return array of objects
   */
  private async parseCsv(buffer: Buffer): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
      const results: CsvRow[] = [];
      // Remove BOM if present
      let content = buffer.toString('utf8');
      if (content.charCodeAt(0) === 0xfeff) {
        content = content.slice(1);
      }
      const stream = Readable.from(content);

      stream
        .pipe(csvParser())
        .on('data', (data: CsvRow) => {
          // Trim all values to remove extra whitespace
          const trimmedData: CsvRow = {};
          for (const key in data) {
            const trimmedKey = key.trim();
            trimmedData[trimmedKey] =
              typeof data[key] === 'string' ? data[key].trim() : data[key];
          }
          results.push(trimmedData);
        })
        .on('end', () => resolve(results))
        .on('error', (error: Error) => reject(error));
    });
  }

  /**
   * Import exercises from CSV
   */
  private async importExercises(lessonId: number, buffer: Buffer) {
    const stats = { created: 0, skipped: 0, failed: 0, errors: [] as string[] };
    const idMap = new Map<number, number>(); // CSV ID -> Database ID

    try {
      const exercises = await this.parseCsv(buffer);

      for (const row of exercises) {
        try {
          // Check for duplicate (same lessonId and order)
          const order = parseInt(row.order || '0');
          const csvId = parseInt(row.id || '0'); // Get CSV ID for mapping

          const existing = await this.prisma.exercise.findFirst({
            where: {
              lessonId,
              order,
            },
          });

          if (existing) {
            stats.skipped++;
            stats.errors?.push(
              `Exercise with order ${order} already exists in lesson ${lessonId}`,
            );
            // Still map the existing ID in case options reference it
            if (csvId) {
              idMap.set(csvId, existing.id);
            }
            continue;
          }

          // Map CSV columns to Exercise model
          const type = row.type as ExerciseType;

          if (!type) {
            stats.failed++;
            stats.errors?.push(
              `Exercise at order ${order} is missing required field 'type'`,
            );
            continue;
          }

          // Validate exercise type
          const validTypes = Object.values(ExerciseType);
          if (!validTypes.includes(type)) {
            stats.failed++;
            stats.errors?.push(
              `Exercise at order ${order} has invalid type '${row.type}'. Valid types: ${validTypes.join(', ')}`,
            );
            continue;
          }

          const createdExercise = await this.prisma.exercise.create({
            data: {
              lessonId,
              type,
              order,
              prompt: row.prompt === '\\N' || !row.prompt ? null : row.prompt,
              imageUrl:
                row.imageUrl === '\\N' || !row.imageUrl ? null : row.imageUrl,
              audioUrl:
                row.audioUrl === '\\N' || !row.audioUrl ? null : row.audioUrl,
              targetText:
                row.targetText === '\\N' || !row.targetText
                  ? null
                  : row.targetText,
              hintEn: row.hintEn === '\\N' || !row.hintEn ? null : row.hintEn,
              hintVi: row.hintVi === '\\N' || !row.hintVi ? null : row.hintVi,
              points: row.points ? parseInt(row.points) : 10,
              difficulty: row.difficulty ? parseInt(row.difficulty) : 1,
            },
          });

          stats.created++;

          // Map CSV ID to Database ID
          if (csvId) {
            idMap.set(csvId, createdExercise.id);
          }
        } catch (error: any) {
          stats.failed++;
          stats.errors?.push(
            `Failed to import exercise at order ${row.order}: ${error.message}`,
          );
        }
      }
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to parse exercises CSV: ${error.message}`,
      );
    }

    return { stats, idMap };
  }

  /**
   * Import exercise options from CSV
   */
  private async importOptions(
    buffer: Buffer,
    exerciseIdMap: Map<number, number>,
  ) {
    const stats = { created: 0, skipped: 0, failed: 0, errors: [] as string[] };

    try {
      const options = await this.parseCsv(buffer);

      for (const row of options) {
        try {
          const csvExerciseId = parseInt(row.exerciseId || '0');
          const order = parseInt(row.order || '0');

          // Map CSV exercise ID to database exercise ID
          const dbExerciseId = exerciseIdMap.get(csvExerciseId);

          if (!dbExerciseId) {
            stats.failed++;
            stats.errors?.push(
              `Exercise with CSV ID ${csvExerciseId} not found in imported exercises. Option at order ${order} skipped.`,
            );
            continue;
          }

          // Verify exercise exists in database
          const exercise = await this.prisma.exercise.findUnique({
            where: { id: dbExerciseId },
          });

          if (!exercise) {
            stats.failed++;
            stats.errors?.push(
              `Exercise with DB ID ${dbExerciseId} (CSV ID: ${csvExerciseId}) not found for option at order ${order}`,
            );
            continue;
          }

          // Check for duplicate (same exerciseId and order)
          const existing = await this.prisma.exerciseOption.findFirst({
            where: {
              exerciseId: dbExerciseId,
              order,
            },
          });

          if (existing) {
            stats.skipped++;
            stats.errors?.push(
              `Option with order ${order} already exists for exercise ${dbExerciseId} (CSV ID: ${csvExerciseId})`,
            );
            continue;
          }

          // Map CSV columns to ExerciseOption model
          const optionData = {
            exerciseId: dbExerciseId, // Use the mapped database ID
            text: row.text === '\\N' || !row.text ? null : row.text,
            imageUrl:
              row.imageUrl === '\\N' || !row.imageUrl ? null : row.imageUrl,
            audioUrl:
              row.audioUrl === '\\N' || !row.audioUrl ? null : row.audioUrl,
            isCorrect: row.isCorrect === 'TRUE' || row.isCorrect === 'true',
            order,
            matchKey:
              row.matchKey === '\\N' || !row.matchKey ? null : row.matchKey,
          };

          await this.prisma.exerciseOption.create({
            data: optionData,
          });

          stats.created++;
        } catch (error: any) {
          stats.failed++;
          stats.errors?.push(
            `Failed to import option for exercise ${row.exerciseId} at order ${row.order}: ${error.message}`,
          );
        }
      }
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to parse options CSV: ${error.message}`,
      );
    }

    return stats;
  }

  /**
   * Import exercises from Excel with asset upload support
   */
  async importFromExcel(
    lessonId: number,
    buffer: Buffer,
    assetFiles: Express.Multer.File[] = [],
  ) {
    // Check if lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    try {
      // Step 1: Upload all assets to Cloudinary and create filename -> URL map
      const assetMap = new Map<string, string>();

      // console.log(`📦 Received ${assetFiles.length} asset files to upload`);

      for (const file of assetFiles) {
        try {
          // console.log(`⬆️  Uploading: ${file.originalname}`);
          const uploadedUrl = await this.uploadToCloudinary(file);
          assetMap.set(file.originalname, uploadedUrl);
          // console.log(`✅ Uploaded: ${file.originalname} -> ${uploadedUrl}`);
        } catch (error) {
          console.error(`❌ Failed to upload ${file.originalname}:`, error);
          // ignore upload failures for individual assets
        }
      }

      // console.log(
      //   `📊 Asset map has ${assetMap.size} entries:`,
      //   Array.from(assetMap.keys()),
      // );

      // Step 2: Parse Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new BadRequestException('Excel file is empty');
      }

      const worksheet = workbook.Sheets[sheetName];

      interface ExcelRow {
        Type?: string;
        type?: string; // Support lowercase as well
        img?: string | number;
        audio?: string | number;
        prompt?: string | number;
        targetText?: string | number;
        hintVi?: string | number;
        hintEn?: string | number;
        optT?: string | number;
        optF?: string | number; // Single optF column
        optF1?: string | number;
        optF2?: string | number;
        optF3?: string | number;
        opt1?: string | number;
        opt2?: string | number;
        opt3?: string | number;
        opt4?: string | number;
        opt5?: string | number;
        opt6?: string | number;
        [key: string]: unknown;
      }

      // Parse with header array to handle duplicate column names
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
      });

      if (!rawData || rawData.length < 2) {
        throw new BadRequestException('No data found in Excel file');
      }

      // Get header row and rename duplicate columns
      const headerRow = rawData[0] as string[];
      // console.log('📋 Original Excel headers:', headerRow);

      const columnCounts = new Map<string, number>();
      const renamedHeaders = headerRow.map((col) => {
        const colStr = String(col || '').trim();
        if (!colStr) return colStr;

        // Rename all optF columns to optF1, optF2, optF3
        if (colStr === 'optF') {
          const count = columnCounts.get(colStr) || 0;
          columnCounts.set(colStr, count + 1);
          return `optF${count + 1}`;
        }

        return colStr;
      });

      // console.log('📋 Renamed headers:', renamedHeaders);

      // Convert to JSON with renamed headers
      const data: ExcelRow[] = [];
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i] as unknown[];
        const obj: ExcelRow = {};
        renamedHeaders.forEach((header, index) => {
          if (header) {
            obj[header] = row[index];
          }
        });
        data.push(obj);
      }

      if (!data || data.length === 0) {
        throw new BadRequestException('No data found in Excel file');
      }

      // Get the current max order for this lesson
      const maxOrderExercise = await this.prisma.exercise.findFirst({
        where: { lessonId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const startOrder = maxOrderExercise ? maxOrderExercise.order + 1 : 0;

      // Helper function to extract filename from path
      const extractFileName = (path: string): string => {
        if (!path || typeof path !== 'string') return '';
        const normalized = path.trim();
        if (normalized === '\\n' || normalized === '\n') return '';
        return normalized.split('\\').pop()?.split('/').pop() || '';
      };

      // Helper function to normalize cell value
      const normalizeValue = (value: unknown): string => {
        if (value === undefined || value === null) return '';
        if (typeof value === 'string') {
          const s = value.trim();
          if (s === '\\n' || s === '\n') return '';
          return s;
        }
        if (typeof value === 'object') return '';
        if (typeof value === 'number' || typeof value === 'boolean') {
          return String(value).trim();
        }
        return '';
      };

      // Helper function to map file path to uploaded URL
      const mapAssetUrl = (cellValue: unknown): string => {
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

      // Create exercises and options in transaction
      return this.prisma.$transaction(async (tx) => {
        const createdExercises = [];

        for (let index = 0; index < data.length; index++) {
          const row = data[index];
          // Support both 'Type' and 'type' column names
          const type = normalizeValue(row.Type || row.type) as ExerciseType;

          // Validate required fields
          if (!type) {
            throw new BadRequestException(`Row ${index + 2}: Type is required`);
          }

          // Validate exercise type
          const validTypes = Object.values(ExerciseType);
          if (!validTypes.includes(type)) {
            throw new BadRequestException(
              `Row ${index + 2}: Invalid type '${type}'. Valid types: ${validTypes.join(', ')}`,
            );
          }

          // Create exercise
          const exercise = await tx.exercise.create({
            data: {
              lessonId,
              type,
              order: startOrder + index,
              prompt: normalizeValue(row.prompt) || null,
              imageUrl: mapAssetUrl(row.img) || null,
              audioUrl: mapAssetUrl(row.audio) || null,
              targetText: normalizeValue(row.targetText) || null,
              hintVi: normalizeValue(row.hintVi) || null,
              hintEn: normalizeValue(row.hintEn) || null,
              points: 10,
              difficulty: 1,
            },
          });

          // Create options based on exercise type
          if (type === 'SELECT_IMAGE') {
            // optT: correct image, optF/optF1-3: incorrect images
            const correctImgPath = row.optT || row.optt || row.OPTT;
            // After rename, optF columns become optF1, optF2, optF3
            const incorrectImg1 = row.optF1 || row.optf1 || row.OPTF1;
            const incorrectImg2 = row.optF2 || row.optf2 || row.OPTF2;
            const incorrectImg3 = row.optF3 || row.optf3 || row.OPTF3;

            const correctImg = mapAssetUrl(correctImgPath);
            const incorrectImgs = [
              { url: mapAssetUrl(incorrectImg1), order: 1 },
              { url: mapAssetUrl(incorrectImg2), order: 2 },
              { url: mapAssetUrl(incorrectImg3), order: 3 },
            ];

            // Always create correct option
            if (correctImg) {
              await tx.exerciseOption.create({
                data: {
                  exerciseId: exercise.id,
                  imageUrl: correctImg,
                  isCorrect: true,
                  order: 0,
                },
              });
            }

            // Create all incorrect options (even if some URLs are empty)
            for (const incorrectOpt of incorrectImgs) {
              if (incorrectOpt.url) {
                await tx.exerciseOption.create({
                  data: {
                    exerciseId: exercise.id,
                    imageUrl: incorrectOpt.url,
                    isCorrect: false,
                    order: incorrectOpt.order,
                  },
                });
              }
            }
          } else if (type === 'MULTIPLE_CHOICE' || type === 'LISTENING') {
            // optT: correct text, optF/optF1-3: incorrect texts
            const correctTextRaw = row.optT || row.optt || row.OPTT;
            // After rename, optF columns become optF1, optF2, optF3
            const incorrectText1 = row.optF1 || row.optf1 || row.OPTF1;
            const incorrectText2 = row.optF2 || row.optf2 || row.OPTF2;
            const incorrectText3 = row.optF3 || row.optf3 || row.OPTF3;

            const correctText = normalizeValue(correctTextRaw);
            const incorrectTexts = [
              { text: normalizeValue(incorrectText1), order: 1 },
              { text: normalizeValue(incorrectText2), order: 2 },
              { text: normalizeValue(incorrectText3), order: 3 },
            ];

            // Always create correct option
            if (correctText) {
              await tx.exerciseOption.create({
                data: {
                  exerciseId: exercise.id,
                  text: correctText,
                  isCorrect: true,
                  order: 0,
                },
              });
            }

            // Create all incorrect options (even if some are empty)
            for (const incorrectOpt of incorrectTexts) {
              if (incorrectOpt.text) {
                await tx.exerciseOption.create({
                  data: {
                    exerciseId: exercise.id,
                    text: incorrectOpt.text,
                    isCorrect: false,
                    order: incorrectOpt.order,
                  },
                });
              }
            }
          } else if (type === 'MATCHING') {
            // For MATCHING type, pairs are in optT, optF1, optF2, optF3 (same structure as other types)
            // Each pair is formatted as "left|right" (e.g., "CarImg|g1-u2-car.png" or "Car|xe hơi")
            // Each pair creates 2 ExerciseOption rows with same matchKey

            const optTVal = normalizeValue(row.optT);
            const optF1Val = normalizeValue(row.optF1);
            const optF2Val = normalizeValue(row.optF2);
            const optF3Val = normalizeValue(row.optF3);

            const allOpts = [optTVal, optF1Val, optF2Val, optF3Val];
            // console.log(`🔍 MATCHING row ${index + 2} opts:`, allOpts);

            const pairs = allOpts.filter((pair) => pair && pair.includes('|'));
            // console.log(
            //   `✅ Found ${pairs.length} valid pairs with '|':`,
            //   pairs,
            // );

            let optionOrder = 0;
            for (let i = 0; i < pairs.length; i++) {
              const [left, right] = pairs[i].split('|').map((s) => s.trim());
              const matchKey = `pair_${i + 1}`;

              // Helper to detect if value is image path
              const isImagePath = (val: string): boolean => {
                return (
                  val.match(/\.(jpg|jpeg|png|gif|webp|mp3|mp4)$/i) !== null ||
                  val.includes('g1-') ||
                  val.includes('/')
                );
              };

              const leftIsImage = isImagePath(left);
              const rightIsImage = isImagePath(right);

              // Create left side option
              await tx.exerciseOption.create({
                data: {
                  exerciseId: exercise.id,
                  text: leftIsImage ? null : left,
                  imageUrl: leftIsImage ? mapAssetUrl(left) || null : null,
                  matchKey,
                  isCorrect: false,
                  order: optionOrder++,
                },
              });

              // Create right side option
              await tx.exerciseOption.create({
                data: {
                  exerciseId: exercise.id,
                  text: rightIsImage ? null : right,
                  imageUrl: rightIsImage ? mapAssetUrl(right) || null : null,
                  matchKey,
                  isCorrect: false,
                  order: optionOrder++,
                },
              });
            }
          }
          // PRONUNCIATION type: no options needed

          createdExercises.push(exercise);
        }

        return createdExercises;
      });
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
