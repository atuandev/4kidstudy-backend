import { IsInt, IsOptional } from 'class-validator';

/**
 * DTO for completing an attempt
 */
export class CompleteAttemptDto {
  @IsOptional()
  @IsInt()
  durationSec?: number;
}
