import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportStats {
  @ApiProperty({ description: 'Number of records created' })
  created: number;

  @ApiProperty({ description: 'Number of records skipped due to duplicates' })
  skipped: number;

  @ApiProperty({ description: 'Number of records failed to import' })
  failed: number;

  @ApiPropertyOptional({
    description: 'List of error messages for failed imports',
  })
  errors?: string[];
}

export class ImportCsvResponseDto {
  @ApiProperty({ description: 'Whether the import was successful' })
  success: boolean;

  @ApiProperty({ description: 'Import statistics for exercises' })
  exercises: ImportStats;

  @ApiProperty({ description: 'Import statistics for exercise options' })
  options: ImportStats;

  @ApiPropertyOptional({ description: 'General message about the import' })
  message?: string;
}
