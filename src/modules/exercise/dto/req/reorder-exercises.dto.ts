import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

export class ReorderExercisesDto {
  @ApiProperty({ 
    description: 'Ordered array of exercise IDs representing the new order', 
    type: [Number] 
  })
  @IsArray()
  @IsInt({ each: true })
  exerciseIds: number[];
}