import { ApiProperty } from '@nestjs/swagger';
import { CreateOptionDto } from './create-option.dto';

export class ExerciseOptionDto extends CreateOptionDto {
  @ApiProperty({ description: 'Unique identifier for the option' })
  id: number;

  @ApiProperty({ description: 'ID of the exercise this option belongs to' })
  exerciseId: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}