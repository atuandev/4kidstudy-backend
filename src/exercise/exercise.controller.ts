import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query, 
  UseGuards,
  ParseIntPipe
} from '@nestjs/common';
import { 
  ApiBearerAuth, 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';
import { ExerciseService } from './exercise.service';
import { 
  CreateExerciseDto, 
  ExerciseDto, 
  UpdateExerciseDto, 
} from './dto/exercise.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExerciseType } from '@prisma/client';

@ApiTags('exercises')
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Get()
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all exercises, optionally filtered by lessonId or type' })
  @ApiQuery({ name: 'lessonId', type: Number, required: false })
  @ApiQuery({ 
    name: 'type', 
    enum: ExerciseType, 
    required: false,
    description: 'Filter by exercise type'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of exercises retrieved successfully',
    type: [ExerciseDto]
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
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
    type: ExerciseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Exercise not found' 
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.findOne(id);
  }

  @Post()
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new exercise' })
  @ApiResponse({ 
    status: 201, 
    description: 'Exercise created successfully',
    type: ExerciseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed' 
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
    type: ExerciseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Exercise not found' 
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
    description: 'Exercise deleted successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Exercise not found' 
  })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.delete(id);
  }
}
