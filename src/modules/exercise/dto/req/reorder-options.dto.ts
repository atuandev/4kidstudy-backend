import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

export class ReorderOptionsDto {
  @ApiProperty({ 
    description: 'Ordered array of option IDs representing the new order', 
    type: [Number] 
  })
  @IsArray()
  @IsInt({ each: true })
  optionIds: number[];
}