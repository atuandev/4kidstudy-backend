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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { FlashcardService } from './flashcard.service';
import {
  CreateFlashcardDto,
  UpdateFlashcardDto,
  FlashcardWithTopicDto,
  FlashcardBulkCreateDto,
} from './dtos/index';

@ApiTags('flashcards')
@Controller('flashcards')
export class FlashcardController {
  constructor(private readonly flashcardService: FlashcardService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new flashcard',
    description: 'Creates a new flashcard for a specific topic',
  })
  @ApiBody({ type: CreateFlashcardDto })
  @ApiResponse({
    status: 201,
    description: 'Flashcard created successfully',
    type: FlashcardWithTopicDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Topic not found',
  })
  @HttpCode(HttpStatus.CREATED)
  async createFlashcard(@Body() createFlashcardDto: CreateFlashcardDto) {
    return this.flashcardService.create(createFlashcardDto);
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Create multiple flashcards',
    description:
      'Creates multiple flashcards for a specific topic in one operation',
  })
  @ApiBody({ type: FlashcardBulkCreateDto })
  @ApiResponse({
    status: 201,
    description: 'Flashcards created successfully',
    type: [FlashcardWithTopicDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or empty flashcards array',
  })
  @ApiResponse({
    status: 404,
    description: 'Topic not found',
  })
  @HttpCode(HttpStatus.CREATED)
  async createBulkFlashcards(
    @Body() flashcardBulkCreateDto: FlashcardBulkCreateDto,
  ) {
    return this.flashcardService.createBulk(flashcardBulkCreateDto);
  }

  @Post('import/:topicId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Import flashcards from Excel',
    description: 'Imports flashcards from an Excel file for a specific topic',
  })
  @ApiParam({
    name: 'topicId',
    description: 'Topic ID',
    type: 'number',
  })
  @ApiResponse({
    status: 201,
    description: 'Flashcards imported successfully',
    type: [FlashcardWithTopicDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid file format or data',
  })
  @ApiResponse({
    status: 404,
    description: 'Topic not found',
  })
  @HttpCode(HttpStatus.CREATED)
  async importFlashcards(
    @Param('topicId', ParseIntPipe) topicId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.flashcardService.importFromExcel(topicId, file.buffer);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all flashcards',
    description: 'Retrieves all flashcards with optional filtering',
  })
  @ApiQuery({
    name: 'topicId',
    required: false,
    type: Number,
    description: 'Filter by topic ID',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in term, meaning, or examples',
  })
  @ApiResponse({
    status: 200,
    description: 'List of flashcards retrieved successfully',
    type: [FlashcardWithTopicDto],
  })
  async getAllFlashcards(
    @Query('topicId') topicId?: number,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
  ) {
    return this.flashcardService.findAll(topicId, isActive, search);
  }

  @Get('topic/:topicId')
  @ApiOperation({
    summary: 'Get flashcards by topic',
    description: 'Retrieves all flashcards for a specific topic',
  })
  @ApiParam({
    name: 'topicId',
    description: 'Topic ID',
    type: 'number',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of flashcards for the topic retrieved successfully',
    type: [FlashcardWithTopicDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Topic not found',
  })
  async getFlashcardsByTopic(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.flashcardService.findByTopic(topicId, isActive);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get flashcard statistics',
    description:
      'Retrieves statistics about flashcards, optionally filtered by topic',
  })
  @ApiQuery({
    name: 'topicId',
    required: false,
    type: Number,
    description: 'Filter statistics by topic ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Flashcard statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalFlashcards: { type: 'number' },
        totalActive: { type: 'number' },
        totalInactive: { type: 'number' },
        byTopic: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topicId: { type: 'number' },
              isActive: { type: 'boolean' },
              _count: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  })
  async getFlashcardStats(@Query('topicId') topicId?: number) {
    return this.flashcardService.getFlashcardStats(topicId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get flashcard by ID',
    description: 'Retrieves a specific flashcard with its topic information',
  })
  @ApiParam({
    name: 'id',
    description: 'Flashcard ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Flashcard retrieved successfully',
    type: FlashcardWithTopicDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Flashcard not found',
  })
  async getFlashcardById(@Param('id', ParseIntPipe) id: number) {
    return this.flashcardService.findOne(id);
  }

  @Put('topic/:topicId/reorder')
  @ApiOperation({
    summary: 'Reorder flashcards in a topic',
    description: 'Updates the order of flashcards within a specific topic',
  })
  @ApiParam({
    name: 'topicId',
    description: 'Topic ID',
    type: 'number',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        flashcardIds: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of flashcard IDs in the desired order',
        },
      },
      required: ['flashcardIds'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Flashcards reordered successfully',
    type: [FlashcardWithTopicDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid flashcard IDs',
  })
  @ApiResponse({
    status: 404,
    description: 'Topic not found',
  })
  async reorderFlashcards(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body('flashcardIds') flashcardIds: number[],
  ) {
    return this.flashcardService.reorderFlashcards(topicId, flashcardIds);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update flashcard',
    description: 'Updates an existing flashcard with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'Flashcard ID',
    type: 'number',
  })
  @ApiBody({ type: UpdateFlashcardDto })
  @ApiResponse({
    status: 200,
    description: 'Flashcard updated successfully',
    type: FlashcardWithTopicDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Flashcard or Topic not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  async updateFlashcard(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFlashcardDto: UpdateFlashcardDto,
  ) {
    return this.flashcardService.update(id, updateFlashcardDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete flashcard',
    description: 'Deletes a specific flashcard',
  })
  @ApiParam({
    name: 'id',
    description: 'Flashcard ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Flashcard deleted successfully',
    type: FlashcardWithTopicDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Flashcard not found',
  })
  @HttpCode(HttpStatus.OK)
  async deleteFlashcard(@Param('id', ParseIntPipe) id: number) {
    return this.flashcardService.remove(id);
  }
}
