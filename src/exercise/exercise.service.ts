import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../modules/prisma/prisma.service';
import { CreateExerciseDto, UpdateExerciseDto } from './dto/exercise.dto';
import { ExerciseType } from '@prisma/client';

@Injectable()
export class ExerciseService {
  constructor(private prisma: PrismaService) {}

  async findAll(lessonId?: number, type?: ExerciseType) {
    const where: any = {};
    
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

  async create(createExerciseDto: CreateExerciseDto) {
    // Check if lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: createExerciseDto.lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${createExerciseDto.lessonId} not found`);
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
            })
          )
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
        throw new NotFoundException(`Lesson with ID ${exerciseData.lessonId} not found`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Update the exercise properties only
      const exercise = await tx.exercise.update({
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
                  order: option.order
                }
              });
              
              if (existingOption) {
                throw new BadRequestException(`An option with order ${option.order} already exists in this exercise`);
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
}
