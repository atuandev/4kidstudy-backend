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
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
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

  @Post('check-progress')
  @ApiOperation({
    summary: 'Check learning progress for sentences',
    description:
      'Check if sentences have learning progress that would be reset',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sentenceIds: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of sentence IDs to check',
        },
      },
      required: ['sentenceIds'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Returns sentences with progress information',
  })
  @HttpCode(HttpStatus.OK)
  async checkProgress(@Body() body: { sentenceIds: number[] }) {
    return this.sentenceService.checkProgress(body.sentenceIds);
  }

  @Post('images/check-progress-for-delete/:id')
  @ApiOperation({
    summary: 'Check if sentence image has learning progress before delete',
    description:
      'Check if sentence image or its sentences have learning progress',
  })
  @ApiParam({
    name: 'id',
    description: 'Sentence image ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns progress information for sentence image',
  })
  @HttpCode(HttpStatus.OK)
  async checkSentenceImageProgressForDelete(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sentenceService.checkSentenceImageProgressForDelete(id);
  }

  @Post('check-progress-for-delete/:id')
  @ApiOperation({
    summary: 'Check if sentence has learning progress before delete',
    description: 'Check if sentence has learning progress',
  })
  @ApiParam({
    name: 'id',
    description: 'Sentence ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns progress information for sentence',
  })
  @HttpCode(HttpStatus.OK)
  async checkSentenceProgressForDelete(@Param('id', ParseIntPipe) id: number) {
    return this.sentenceService.checkSentenceProgressForDelete(id);
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

  @Post('import-excel/:topicId')
  @ApiOperation({
    summary: 'Import sentences from Excel',
    description:
      'Imports sentence images and sentences from an Excel file. One Excel row creates one SentenceImage with 1-4 Sentence records. Supports uploading images and audio files along with the Excel file.',
  })
  @ApiParam({
    name: 'topicId',
    description: 'Topic ID to import sentences into',
    type: 'number',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Sentences imported successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or invalid Excel format',
  })
  @ApiResponse({
    status: 404,
    description: 'Topic not found',
  })
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'excel', maxCount: 1 },
      { name: 'assets', maxCount: 100 },
    ]),
  )
  async importFromExcel(
    @Param('topicId', ParseIntPipe) topicId: number,
    @UploadedFiles()
    files: {
      excel?: Express.Multer.File[];
      assets?: Express.Multer.File[];
    },
  ) {
    if (!files.excel || files.excel.length === 0) {
      throw new BadRequestException('Excel file is required');
    }

    const excelFile = files.excel[0];
    const assetFiles = files.assets || [];

    return this.sentenceService.importFromExcel(
      topicId,
      excelFile.buffer,
      assetFiles,
    );
  }
}
