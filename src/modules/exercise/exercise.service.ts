import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExerciseDto,
  CreateOptionDto,
  UpdateExerciseDto,
  UpdateOptionDto,
  ImportCsvResponseDto,
} from './dto/index';
import { ExerciseType } from '@prisma/client';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

interface CsvRow {
  [key: string]: string;
}

@Injectable()
export class ExerciseService {
  constructor(private prisma: PrismaService) {}

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
}
