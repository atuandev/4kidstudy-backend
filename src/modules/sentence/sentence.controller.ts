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
import { SentenceService } from './sentence.service';
import {
  CreateSentenceImageDto,
  CreateSentenceDto,
  CreateSentenceImageWithSentencesDto,
  UpdateSentenceImageDto,
  UpdateSentenceDto,
  SentenceImageResponseDto,
  SentenceResponseDto,
  SentenceBulkCreateDto,
} from './dtos/index';

@ApiTags('sentences')
@Controller('sentences')
export class SentenceController {
  constructor(private readonly sentenceService: SentenceService) {}

  @Get('images')
  @ApiOperation({
    summary: 'Get all sentence images',
    description:
      'Retrieves all sentence images with their associated sentences',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all sentence images retrieved successfully',
    type: [SentenceImageResponseDto],
  })
  async getAllSentenceImages(@Query('isActive') isActive?: boolean) {
    return this.sentenceService.getAllSentenceImages(isActive);
  }

  @Get('images/topic/:topicId')
  @ApiOperation({
    summary: 'Get sentence images by topic ID',
    description:
      'Retrieves all sentence images with their associated sentences for a specific topic',
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
    description: 'List of sentence images for the topic retrieved successfully',
    type: [SentenceImageResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Topic not found',
  })
  async getSentenceImagesByTopicId(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.sentenceService.getSentenceImagesByTopicId(topicId, isActive);
  }

  @Post('images/with-sentences')
  @ApiOperation({
    summary: 'Create a sentence image with sentences',
    description:
      'Creates a new sentence image along with multiple sentences in a single transaction',
  })
  @ApiBody({ type: CreateSentenceImageWithSentencesDto })
  @ApiResponse({
    status: 201,
    description: 'Sentence image with sentences created successfully',
    type: SentenceImageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or no sentences provided',
  })
  @ApiResponse({
    status: 404,
    description: 'Topic not found',
  })
  @HttpCode(HttpStatus.CREATED)
  async createSentenceImageWithSentences(
    @Body() createDto: CreateSentenceImageWithSentencesDto,
  ) {
    return this.sentenceService.createSentenceImageWithSentences(createDto);
  }

  @Post('images')
  @ApiOperation({
    summary: 'Create a new sentence image',
    description: 'Creates a new sentence image for a specific topic',
  })
  @ApiBody({ type: CreateSentenceImageDto })
  @ApiResponse({
    status: 201,
    description: 'Sentence image created successfully',
    type: SentenceImageResponseDto,
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
  async createSentenceImage(
    @Body() createSentenceImageDto: CreateSentenceImageDto,
  ) {
    return this.sentenceService.createSentenceImage(createSentenceImageDto);
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Create multiple sentence images with sentences',
    description:
      'Creates multiple sentence images with their sentences for a specific topic in one operation',
  })
  @ApiBody({ type: SentenceBulkCreateDto })
  @ApiResponse({
    status: 201,
    description: 'Sentence images with sentences created successfully',
    type: [SentenceImageResponseDto],
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - validation failed or empty sentence images array',
  })
  @ApiResponse({
    status: 404,
    description: 'Topic not found',
  })
  @HttpCode(HttpStatus.CREATED)
  async createBulkSentences(
    @Body() sentenceBulkCreateDto: SentenceBulkCreateDto,
  ) {
    return this.sentenceService.createBulk(sentenceBulkCreateDto);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new sentence',
    description: 'Creates a new sentence for a specific sentence image',
  })
  @ApiBody({ type: CreateSentenceDto })
  @ApiResponse({
    status: 201,
    description: 'Sentence created successfully',
    type: SentenceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Sentence image not found',
  })
  @HttpCode(HttpStatus.CREATED)
  async createSentence(@Body() createSentenceDto: CreateSentenceDto) {
    return this.sentenceService.createSentence(createSentenceDto);
  }

  @Get('images/:id')
  @ApiOperation({
    summary: 'Get sentence image by ID',
    description:
      'Retrieves a specific sentence image with its associated sentences',
  })
  @ApiParam({
    name: 'id',
    description: 'Sentence image ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Sentence image retrieved successfully',
    type: SentenceImageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sentence image not found',
  })
  async getSentenceImageById(@Param('id', ParseIntPipe) id: number) {
    return this.sentenceService.getSentenceImageById(id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get sentence by ID',
    description: 'Retrieves a specific sentence',
  })
  @ApiParam({
    name: 'id',
    description: 'Sentence ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Sentence retrieved successfully',
    type: SentenceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sentence not found',
  })
  async getSentenceById(@Param('id', ParseIntPipe) id: number) {
    return this.sentenceService.getSentenceById(id);
  }

  @Put('images/:id')
  @ApiOperation({
    summary: 'Update sentence image',
    description: 'Updates an existing sentence image with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'Sentence image ID',
    type: 'number',
  })
  @ApiBody({ type: UpdateSentenceImageDto })
  @ApiResponse({
    status: 200,
    description: 'Sentence image updated successfully',
    type: SentenceImageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sentence image or Topic not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  async updateSentenceImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSentenceImageDto: UpdateSentenceImageDto,
  ) {
    return this.sentenceService.updateSentenceImage(id, updateSentenceImageDto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update sentence',
    description: 'Updates an existing sentence with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'Sentence ID',
    type: 'number',
  })
  @ApiBody({ type: UpdateSentenceDto })
  @ApiResponse({
    status: 200,
    description: 'Sentence updated successfully',
    type: SentenceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sentence or Sentence image not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  async updateSentence(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSentenceDto: UpdateSentenceDto,
  ) {
    return this.sentenceService.updateSentence(id, updateSentenceDto);
  }

  @Delete('images/:id')
  @ApiOperation({
    summary: 'Delete sentence image',
    description:
      'Deletes a specific sentence image and its associated sentences',
  })
  @ApiParam({
    name: 'id',
    description: 'Sentence image ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Sentence image deleted successfully',
    type: SentenceImageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sentence image not found',
  })
  @HttpCode(HttpStatus.OK)
  async deleteSentenceImage(@Param('id', ParseIntPipe) id: number) {
    return this.sentenceService.deleteSentenceImage(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete sentence',
    description: 'Deletes a specific sentence',
  })
  @ApiParam({
    name: 'id',
    description: 'Sentence ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Sentence deleted successfully',
    type: SentenceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sentence not found',
  })
  @HttpCode(HttpStatus.OK)
  async deleteSentence(@Param('id', ParseIntPipe) id: number) {
    return this.sentenceService.deleteSentence(id);
  }
}
