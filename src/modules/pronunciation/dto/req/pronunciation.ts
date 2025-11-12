import { IsNotEmpty, IsString } from 'class-validator';

export class AssessmentDto {
  @IsString()
  @IsNotEmpty()
  referenceText: string;
}