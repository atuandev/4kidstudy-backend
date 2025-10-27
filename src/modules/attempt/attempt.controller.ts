import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { AttemptService } from './attempt.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateAttemptDto,
  CreateAttemptDetailDto,
  SubmitExerciseDto,
  CompleteAttemptDto,
  GetAttemptsQueryDto,
  AttemptResponseDto,
  PaginatedAttemptsResponseDto,
  AttemptDetailResponseDto,
} from './dto';
import { ApiBearerAuth } from '@nestjs/swagger';

/**
 * Controller for handling lesson attempts
 */
@Controller('attempts')
@UseGuards(JwtAuthGuard)
export class AttemptController {
  constructor(private readonly attemptService: AttemptService) {}

  /**
   * Start a new lesson attempt
   * POST /attempts
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async startAttempt(
    @Request() req: any,
    @Body() createAttemptDto: CreateAttemptDto,
  ): Promise<AttemptResponseDto> {
    const userId = req.user.id;
    return this.attemptService.startAttempt(userId, createAttemptDto);
  }

  /**
   * Create an attempt detail record
   * POST /attempts/details
   */
  @Post('details')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createAttemptDetail(
    @Body() createAttemptDetailDto: CreateAttemptDetailDto,
  ): Promise<AttemptDetailResponseDto> {
    return await this.attemptService.createAttemptDetail(
      createAttemptDetailDto,
    );
  }

  /**
   * Submit an exercise answer within an attempt
   * POST /attempts/:id/submit
   */
  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async submitExercise(
    @Param('id', ParseIntPipe) attemptId: number,
    @Body() submitExerciseDto: SubmitExerciseDto,
  ): Promise<AttemptDetailResponseDto> {
    return this.attemptService.submitExercise(attemptId, submitExerciseDto);
  }

  /**
   * Complete an attempt
   * PATCH /attempts/:id/complete
   */
  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async completeAttempt(
    @Param('id', ParseIntPipe) attemptId: number,
    @Body() completeAttemptDto: CompleteAttemptDto,
  ): Promise<AttemptResponseDto> {
    return this.attemptService.completeAttempt(attemptId, completeAttemptDto);
  }

  /**
   * Get attempt by ID
   * GET /attempts/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAttemptById(
    @Param('id', ParseIntPipe) attemptId: number,
  ): Promise<AttemptResponseDto> {
    return this.attemptService.getAttemptById(attemptId);
  }

  /**
   * Get attempts with filters and pagination
   * GET /attempts
   */
  @Get()
  async getAttempts(
    @Query() query: GetAttemptsQueryDto,
  ): Promise<PaginatedAttemptsResponseDto> {
    return this.attemptService.getAttempts(query);
  }

  /**
   * Get user's best attempt for a lesson
   * GET /attempts/lesson/:lessonId/best
   */
  @Get('lesson/:lessonId/best')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getBestAttempt(
    @Request() req: any,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ): Promise<AttemptResponseDto | null> {
    const userId = req.user.id;
    return this.attemptService.getBestAttempt(userId, lessonId);
  }

  /**
   * Get user's attempt history for a lesson
   * GET /attempts/lesson/:lessonId/history
   */
  @Get('lesson/:lessonId/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getUserLessonAttempts(
    @Request() req: any,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ): Promise<AttemptResponseDto[]> {
    const userId = req.user.id;
    return this.attemptService.getUserLessonAttempts(userId, lessonId);
  }
}
