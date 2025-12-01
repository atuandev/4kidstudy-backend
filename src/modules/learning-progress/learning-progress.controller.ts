import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { LearningProgressService } from './learning-progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateLearningProgressDto,
  UpdateLearningProgressDto,
  GetLearningProgressQueryDto,
  ReviewContentDto,
  LearningProgressResponseDto,
  PaginatedLearningProgressResponseDto,
  LearningProgressStatsResponseDto,
  TopicProgressResponseDto,
} from './dtos';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/**
 * Controller for handling learning progress tracking
 */
@ApiTags('Learning Progress')
@Controller('learning-progress')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LearningProgressController {
  constructor(
    private readonly learningProgressService: LearningProgressService,
  ) {}

  /**
   * Get or create learning progress
   * POST /learning-progress
   */
  @Post()
  async getOrCreateProgress(
    @Request() req: any,
    @Body() createDto: CreateLearningProgressDto,
  ): Promise<LearningProgressResponseDto> {
    const userId = req.user.id;
    return this.learningProgressService.getOrCreateProgress(userId, createDto);
  }

  /**
   * Review content (increment review count)
   * POST /learning-progress/review
   */
  @Post('review')
  async reviewContent(
    @Request() req: any,
    @Body() reviewDto: ReviewContentDto,
  ): Promise<LearningProgressResponseDto> {
    const userId = req.user.id;
    return this.learningProgressService.reviewContent(userId, reviewDto);
  }

  /**
   * Get user's learning progress statistics
   * GET /learning-progress/stats
   */
  @Get('stats')
  async getUserStats(
    @Request() req: any,
  ): Promise<LearningProgressStatsResponseDto> {
    const userId = req.user.id;
    return this.learningProgressService.getUserStats(userId);
  }

  /**
   * Get learning progress by topic
   * GET /learning-progress/topic/:topicId
   */
  @Get('topic/:topicId')
  async getTopicProgress(
    @Request() req: any,
    @Param('topicId', ParseIntPipe) topicId: number,
  ): Promise<TopicProgressResponseDto> {
    const userId = req.user.id;
    return this.learningProgressService.getTopicProgress(userId, topicId);
  }

  /**
   * Get reviewed flashcard IDs for a topic
   * GET /learning-progress/topic/:topicId/reviewed-flashcards
   */
  @Get('topic/:topicId/reviewed-flashcards')
  async getReviewedFlashcards(
    @Request() req: any,
    @Param('topicId', ParseIntPipe) topicId: number,
  ): Promise<{ flashcardIds: number[] }> {
    const userId = req.user.id;
    const flashcardIds =
      await this.learningProgressService.getReviewedFlashcardIds(
        userId,
        topicId,
      );
    return { flashcardIds };
  }

  /**
   * Get reviewed sentence IDs for a topic
   * GET /learning-progress/topic/:topicId/reviewed-sentences
   */
  @Get('topic/:topicId/reviewed-sentences')
  async getReviewedSentences(
    @Request() req: any,
    @Param('topicId', ParseIntPipe) topicId: number,
  ): Promise<{ sentenceIds: number[] }> {
    const userId = req.user.id;
    const sentenceIds =
      await this.learningProgressService.getReviewedSentenceIds(
        userId,
        topicId,
      );
    return { sentenceIds };
  }

  /**
   * Get last reviewed topic ID
   * GET /learning-progress/last-topic
   */
  @Get('last-topic')
  async getLastReviewedTopic(
    @Request() req: any,
  ): Promise<{ topicId: number | null }> {
    const userId = req.user.id;
    const topicId =
      await this.learningProgressService.getLastReviewedTopic(userId);
    return { topicId };
  }

  /**
   * Get user's learning progress list (paginated)
   * GET /learning-progress
   */
  @Get()
  async getUserProgress(
    @Request() req: any,
    @Query() query: GetLearningProgressQueryDto,
  ): Promise<PaginatedLearningProgressResponseDto> {
    const userId = req.user.id;
    return this.learningProgressService.getUserProgress(userId, query);
  }

  /**
   * Get learning progress by ID
   * GET /learning-progress/:id
   */
  @Get(':id')
  async getProgressById(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LearningProgressResponseDto> {
    const userId = req.user.id;
    return this.learningProgressService.getProgressById(id, userId);
  }

  /**
   * Update learning progress
   * PATCH /learning-progress/:id
   */
  @Patch(':id')
  async updateProgress(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateLearningProgressDto,
  ): Promise<LearningProgressResponseDto> {
    const userId = req.user.id;
    return this.learningProgressService.updateProgress(id, userId, updateDto);
  }

  /**
   * Delete learning progress
   * DELETE /learning-progress/:id
   */
  @Delete(':id')
  async deleteProgress(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    await this.learningProgressService.deleteProgress(id, userId);
    return { message: 'Learning progress deleted successfully' };
  }
}
