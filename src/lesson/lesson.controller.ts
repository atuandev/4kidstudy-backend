import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  ParseIntPipe, 
  UseGuards 
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LessonService } from './lesson.service';
import { CreateLessonDto, LessonQueryParamsDto, LessonResponseDto, UpdateLessonDto } from './dto/lesson.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('lessons')
@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}
  
  @Get()
  @ApiOperation({ summary: 'Get all lessons with optional filtering' })
  @ApiQuery({ type: LessonQueryParamsDto })
  @ApiResponse({ 
    status: 200, 
    description: 'List of lessons retrieved successfully',
    type: [LessonResponseDto],
  })
  async findAll(@Query() queryParams: LessonQueryParamsDto) {
    return this.lessonService.findAll({
      skip: queryParams.skip,
      take: queryParams.take,
      topicId: queryParams.topicId,
      status: queryParams.status,
    });
  }
  
  @Get(':id')
  @ApiOperation({ summary: 'Get a lesson by ID' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lesson retrieved successfully',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.lessonService.findById(id);
  }
  
  @Post()
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new lesson' })
  @ApiResponse({ 
    status: 201, 
    description: 'Lesson created successfully',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonService.create(createLessonDto);
  }
  
  @Put(':id')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a lesson' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lesson updated successfully',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return this.lessonService.update(id, updateLessonDto);
  }
  
  @Delete(':id')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a lesson' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lesson deleted successfully',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.lessonService.delete(id);
  }
}
