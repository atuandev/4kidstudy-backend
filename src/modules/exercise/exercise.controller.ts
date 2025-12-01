import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  // UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  // ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ExerciseService } from './exercise.service';
import {
  CreateExerciseDto,
  CreateManyExercisesDto,
  CreateOptionDto,
  ExerciseDto,
  ExerciseOptionDto,
  ReorderExercisesDto,
  ReorderOptionsDto,
  UpdateExerciseDto,
  UpdateOptionDto,
  ImportCsvDto,
  ImportCsvResponseDto,
} from './dto/index';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExerciseType } from '@prisma/client';

@ApiTags('exercises')
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Get()
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all exercises, optionally filtered by lessonId or type',
  })
  @ApiQuery({ name: 'lessonId', type: Number, required: false })
  @ApiQuery({
    name: 'type',
    enum: ExerciseType,
    required: false,
    description: 'Filter by exercise type',
  })
  @ApiResponse({
    status: 200,
    description: 'List of exercises retrieved successfully',
    type: [ExerciseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findAll(
    @Query('lessonId') lessonId?: number,
    @Query('type') type?: ExerciseType,
  ) {
    return this.exerciseService.findAll(lessonId, type);
  }

  @Get(':id')
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an exercise by ID' })
  @ApiParam({ name: 'id', description: 'Exercise ID' })
  @ApiResponse({
    status: 200,
    description: 'Exercise retrieved successfully',
    type: ExerciseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Exercise not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.findOne(id);
  }

  @Get(':id/options')
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all options for an exercise by exercise ID' })
  @ApiParam({ name: 'id', description: 'Exercise ID' })
  @ApiResponse({
    status: 200,
    description: 'Exercise options retrieved successfully',
    type: [ExerciseOptionDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Exercise not found',
  })
  async getExerciseOptions(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.getExerciseOptions(id);
  }

  @Post()
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new exercise' })
  @ApiResponse({
    status: 201,
    description: 'Exercise created successfully',
    type: ExerciseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  async create(@Body() createExerciseDto: CreateExerciseDto) {
    return this.exerciseService.create(createExerciseDto);
  }

  @Post('bulk')
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  @ApiOperation({ summary: 'Create multiple exercises at once' })
  @ApiResponse({
    status: 201,
    description: 'Exercises created successfully',
    type: [ExerciseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more lessons not found',
  })
  async createMany(@Body() createManyDto: CreateManyExercisesDto) {
    return this.exerciseService.createMany(createManyDto);
  }

  @Put(':id')
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an exercise by ID' })
  @ApiParam({ name: 'id', description: 'Exercise ID' })
  @ApiResponse({
    status: 200,
    description: 'Exercise updated successfully',
    type: ExerciseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Exercise not found',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExerciseDto: UpdateExerciseDto,
  ) {
    return this.exerciseService.update(id, updateExerciseDto);
  }

  @Delete(':id')
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an exercise by ID' })
  @ApiParam({ name: 'id', description: 'Exercise ID' })
  @ApiResponse({
    status: 200,
    description: 'Exercise deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Exercise not found',
  })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.delete(id);
  }

  @Post(':id/options')
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new option to an exercise' })
  @ApiParam({ name: 'id', description: 'Exercise ID' })
  @ApiResponse({
    status: 201,
    description: 'Option added successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Exercise not found',
  })
  async createOption(
    @Param('id', ParseIntPipe) id: number,
    @Body() createOptionDto: CreateOptionDto,
  ) {
    return this.exerciseService.createOption(id, createOptionDto);
  }

  @Put('options/:id')
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an option by ID' })
  @ApiParam({ name: 'id', description: 'Option ID' })
  @ApiResponse({
    status: 200,
    description: 'Option updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Option not found',
  })
  async updateOption(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOptionDto: UpdateOptionDto,
  ) {
    return this.exerciseService.updateOption(id, updateOptionDto);
  }

  @Delete('options/:id')
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an option by ID' })
  @ApiParam({ name: 'id', description: 'Option ID' })
  @ApiResponse({
    status: 200,
    description: 'Option deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Option not found',
  })
  async deleteOption(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.deleteOption(id);
  }

  @Put('lessons/:lessonId/reorder')
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder exercises within a lesson' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  @ApiResponse({
    status: 200,
    description: 'Exercises reordered successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid exercise IDs',
  })
  async reorderExercises(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() reorderDto: ReorderExercisesDto,
  ) {
    return this.exerciseService.reorderExercises(
      lessonId,
      reorderDto.exerciseIds,
    );
  }

  @Put(':id/options/reorder')
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder options within an exercise' })
  @ApiParam({ name: 'id', description: 'Exercise ID' })
  @ApiResponse({
    status: 200,
    description: 'Options reordered successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid option IDs',
  })
  async reorderOptions(
    @Param('id', ParseIntPipe) id: number,
    @Body() reorderDto: ReorderOptionsDto,
  ) {
    return this.exerciseService.reorderOptions(id, reorderDto.optionIds);
  }

  @Post('import')
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Import exercises and/or exercise options from CSV files for a lesson',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV files for exercises and/or options with lessonId',
    schema: {
      type: 'object',
      required: ['lessonId'],
      properties: {
        lessonId: {
          type: 'integer',
          description: 'ID of the lesson to import exercises for',
        },
        exercisesFile: {
          type: 'string',
          format: 'binary',
          description:
            'CSV file containing exercises (columns: type, order, prompt, imageUrl, audioUrl, targetText, hintEn, hintVi, points, difficulty)',
        },
        optionsFile: {
          type: 'string',
          format: 'binary',
          description:
            'CSV file containing exercise options (columns: exerciseId, text, imageUrl, audioUrl, isCorrect, order, matchKey)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'CSV files imported successfully',
    type: ImportCsvResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid CSV format or data',
  })
  @ApiResponse({
    status: 404,
    description: 'Lesson not found',
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'exercisesFile', maxCount: 1 },
      { name: 'optionsFile', maxCount: 1 },
    ]),
  )
  async importCsv(
    @Body('lessonId', ParseIntPipe) lessonId: number,
    @UploadedFiles()
    files: {
      exercisesFile?: Express.Multer.File[];
      optionsFile?: Express.Multer.File[];
    },
  ) {
    const exercisesFile = files?.exercisesFile?.[0];
    const optionsFile = files?.optionsFile?.[0];

    if (!exercisesFile && !optionsFile) {
      throw new BadRequestException(
        'At least one CSV file (exercisesFile or optionsFile) must be provided',
      );
    }

    return this.exerciseService.importFromCsv(
      lessonId,
      exercisesFile,
      optionsFile,
    );
  }

  @Post('import-excel/:lessonId')
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  @ApiOperation({
    summary: 'Import exercises from Excel file with asset uploads',
  })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        excelFile: {
          type: 'string',
          format: 'binary',
          description: 'Excel file containing exercise data',
        },
        assets: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Image and audio asset files',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Excel file imported successfully',
    type: [ExerciseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid Excel format or data',
  })
  @ApiResponse({
    status: 404,
    description: 'Lesson not found',
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'excelFile', maxCount: 1 },
      { name: 'assets', maxCount: 50 },
    ]),
  )
  async importExcel(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @UploadedFiles()
    files: {
      excelFile?: Express.Multer.File[];
      assets?: Express.Multer.File[];
    },
  ) {
    const excelFile = files?.excelFile?.[0];
    const assetFiles = files?.assets || [];

    if (!excelFile) {
      throw new BadRequestException('Excel file is required');
    }

    return this.exerciseService.importFromExcel(
      lessonId,
      excelFile.buffer,
      assetFiles,
    );
  }
}
