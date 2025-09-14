import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseDto, CreateOptionDto, UpdateExerciseDto, UpdateOptionDto } from './dto/index';
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

  async createOption(exerciseId: number, createOptionDto: CreateOptionDto) {
    // Check if exercise exists
    await this.findOne(exerciseId);

    // If order is provided, check if it already exists
    if (createOptionDto.order !== undefined) {
      const existingOption = await this.prisma.exerciseOption.findFirst({
        where: { 
          exerciseId,
          order: createOptionDto.order
        }
      });
      
      if (existingOption) {
        throw new BadRequestException(`An option with order ${createOptionDto.order} already exists in this exercise`);
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
    if (updateOptionDto.order !== undefined && updateOptionDto.order !== option.order) {
      const existingOption = await this.prisma.exerciseOption.findFirst({
        where: { 
          exerciseId: option.exerciseId,
          order: updateOptionDto.order,
          id: { not: id } // Exclude the current option
        }
      });
      
      if (existingOption) {
        throw new BadRequestException(`Another option with order ${updateOptionDto.order} already exists in this exercise`);
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
      throw new BadRequestException('Some exercises do not exist or do not belong to the specified lesson');
    }

    // Update order of each exercise
    await Promise.all(
      exerciseIds.map((id, index) =>
        this.prisma.exercise.update({
          where: { id },
          data: { order: index },
        })
      )
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
      throw new BadRequestException('Some options do not exist or do not belong to the specified exercise');
    }

    // Update order of each option
    await Promise.all(
      optionIds.map((id, index) =>
        this.prisma.exerciseOption.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    // Return the reordered options
    return this.prisma.exerciseOption.findMany({
      where: { exerciseId },
      orderBy: { order: 'asc' },
    });
  }
}
