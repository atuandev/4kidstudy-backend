import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class ImportCsvDto {
  @ApiProperty({ description: 'ID of the lesson for exercises import' })
  @IsInt()
  lessonId: number;

  @ApiPropertyOptional({
    description: 'CSV file containing exercises data',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  exercisesFile?: any;

  @ApiPropertyOptional({
    description: 'CSV file containing exercise options data',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  optionsFile?: any;
}
