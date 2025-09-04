import {
  Body,
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { TopicService } from './topic.service';
import {
  CreateTopicDto,
  UpdateTopicDto,
  TopicResponseDto,
  TopicWithRelationsDto,
  TopicStatsDto,
  GradeLevel,
} from './dtos/topic.dto';

@ApiTags('topics')
@Controller('topics')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new topic',
    description: 'Creates a new topic for the specified grade level',
  })
  @ApiBody({ type: CreateTopicDto })
  @ApiResponse({
    status: 201,
    description: 'Topic created successfully',
    type: TopicResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - topic with same title and grade already exists',
  })
  @HttpCode(HttpStatus.CREATED)
  async createTopic(@Body() createTopicDto: CreateTopicDto) {
    return this.topicService.create(createTopicDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all topics',
    description:
      'Retrieves all topics with optional filtering by grade level and active status',
  })
  @ApiQuery({
    name: 'grade',
    required: false,
    enum: GradeLevel,
    description: 'Filter by grade level',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of topics retrieved successfully',
    type: TopicWithRelationsDto,
    isArray: true,
  })
  async getAllTopics(
    @Query('grade') grade?: GradeLevel,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.topicService.findAll(grade, isActive);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get topic by ID',
    description: 'Retrieves a specific topic with its lessons and flashcards',
  })
  @ApiParam({
    name: 'id',
    description: 'Topic ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Topic retrieved successfully',
    type: TopicWithRelationsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Topic not found',
  })
  async getTopicById(@Param('id', ParseIntPipe) id: number) {
    return this.topicService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Get topic statistics',
    description:
      'Retrieves statistics for a specific topic including lesson and exercise counts',
  })
  @ApiParam({
    name: 'id',
    description: 'Topic ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Topic statistics retrieved successfully',
    type: TopicStatsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Topic not found',
  })
  async getTopicStats(@Param('id', ParseIntPipe) id: number) {
    return this.topicService.getTopicStats(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update topic',
    description: 'Updates an existing topic with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'Topic ID',
    type: 'number',
  })
  @ApiBody({ type: UpdateTopicDto })
  @ApiResponse({
    status: 200,
    description: 'Topic updated successfully',
    type: TopicResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Topic not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  async updateTopic(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTopicDto: UpdateTopicDto,
  ) {
    return this.topicService.update(id, updateTopicDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete topic',
    description:
      'Deletes a topic and all its associated lessons and flashcards',
  })
  @ApiParam({
    name: 'id',
    description: 'Topic ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Topic deleted successfully',
    type: TopicResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Topic not found',
  })
  @HttpCode(HttpStatus.OK)
  async deleteTopic(@Param('id', ParseIntPipe) id: number) {
    return this.topicService.remove(id);
  }
}
