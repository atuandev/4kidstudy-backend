/**
 * Response DTO for most wrong exercises in a lesson
 */
export class MostWrongExerciseStatsDto {
  exerciseId: number;
  exerciseOrder: number;
  exercisePrompt?: string;
  firstWrongCount: number;
  secondWrongCount: number;
  totalWrongCount: number;
}
