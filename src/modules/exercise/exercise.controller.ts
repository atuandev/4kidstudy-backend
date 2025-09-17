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
} from '@nestjs/common';
import {
  // ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ExerciseService } from './exercise.service';
import {
  CreateExerciseDto,
  CreateOptionDto,
  ExerciseDto,
  ExerciseOptionDto,
  ReorderExercisesDto,
  ReorderOptionsDto,
  UpdateExerciseDto,
  UpdateOptionDto,
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
}
