import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType, OmitType } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateExerciseDto } from './create-exercise.dto';
import { UpdateOptionDto } from './update-option.dto';

export class UpdateExerciseDto extends PartialType(OmitType(CreateExerciseDto, ['options'] as const)) {
  @ApiPropertyOptional({ type: [UpdateOptionDto], description: 'Options to update' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOptionDto)
  @IsOptional()
  options?: UpdateOptionDto[];
}