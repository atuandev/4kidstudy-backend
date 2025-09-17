import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';
import { CreateOptionDto } from './create-option.dto';

export class UpdateOptionDto extends PartialType(CreateOptionDto) {
  @ApiPropertyOptional({
    description: 'Unique identifier for the option (required for updates)',
  })
  @IsInt()
  @IsOptional()
  id?: number;
}
