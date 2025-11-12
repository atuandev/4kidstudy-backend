import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PronunciationScoreResponseDto {
  @ApiProperty({ description: 'Unique identifier for the pronunciation score' })
  id: number;

  @ApiProperty({ description: 'The attempt detail ID this score belongs to' })
  attemptDetailId: number;

  @ApiPropertyOptional({
    description: 'Accuracy score (0-100)',
    example: 85.5,
  })
  accuracy?: number;

  @ApiPropertyOptional({
    description: 'Fluency score (0-100)',
    example: 78.3,
  })
  fluency?: number;

  @ApiPropertyOptional({
    description: 'Completeness score (0-100)',
    example: 90.0,
  })
  completeness?: number;

  @ApiPropertyOptional({
    description: 'Prosody score (0-100)',
    example: 82.7,
  })
  prosody?: number;

  @ApiPropertyOptional({
    description: 'Overall score (0-100)',
    example: 84.1,
  })
  overall?: number;

  @ApiPropertyOptional({
    description: 'Raw JSON result from Azure Speech API',
  })
  rawJson?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'URL to the recorded audio file',
    example: 'https://example.com/audio.mp3',
  })
  audioUrl?: string;

  @ApiProperty({ description: 'When the score was created' })
  createdAt: Date;
}
