import { IsInt, IsNotEmpty } from 'class-validator';

/**
 * DTO for creating a new attempt (starting a lesson)
 */
export class CreateAttemptDto {
  @IsInt()
  @IsNotEmpty()
  lessonId: number;
}
