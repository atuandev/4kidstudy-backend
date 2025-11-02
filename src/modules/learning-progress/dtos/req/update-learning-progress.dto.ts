import { IsBoolean, IsInt, IsOptional, IsDateString } from 'class-validator';

/**
 * DTO for updating learning progress
 */
export class UpdateLearningProgressDto {
  @IsInt()
  @IsOptional()
  reviewCount?: number;

  @IsBoolean()
  @IsOptional()
  isMastered?: boolean;

  @IsDateString()
  @IsOptional()
  lastReviewedAt?: string;
}
