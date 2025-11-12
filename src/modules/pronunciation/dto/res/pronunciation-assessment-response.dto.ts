import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for real-time pronunciation assessment
 * This is the result returned immediately after assessing audio
 */
export class PronunciationAssessmentResponseDto {
  @ApiProperty({ description: 'Assessment was successful' })
  success: boolean;

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
    description: 'Overall pronunciation score (0-100)',
    example: 84.1,
  })
  overall?: number;

  @ApiPropertyOptional({
    description: 'Recognized text from the audio',
    example: 'Hello world',
  })
  recognizedText?: string;

  @ApiPropertyOptional({
    description: 'Error message if assessment failed',
  })
  error?: string;

  @ApiPropertyOptional({
    description: 'Detailed word-level assessment results',
    type: 'array',
  })
  words?: Array<{
    word: string;
    accuracy: number;
    errorType?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Raw JSON result from Azure Speech API for debugging',
  })
  rawResult?: Record<string, any>;
}
