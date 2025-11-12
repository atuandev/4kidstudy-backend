import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  ParseFilePipe,
  MaxFileSizeValidator,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { PronunciationService } from './pronunciation.service';
import { AssessmentDto } from './dto/req/pronunciation';
import { PronunciationAssessmentResponseDto } from './dto/res/pronunciation';

@ApiTags('Pronunciation')
@Controller('pronunciation')
export class PronunciationController {
  constructor(private readonly pronunciationService: PronunciationService) {}

  @Post('assess')
  @ApiOperation({
    summary: 'Assess pronunciation from audio file',
    description:
      'Upload an MP3 audio file and reference text to get pronunciation assessment scores. The MP3 will be automatically converted to WAV format for processing.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Audio file and reference text for assessment',
    schema: {
      type: 'object',
      required: ['audioFile', 'referenceText'],
      properties: {
        audioFile: {
          type: 'string',
          format: 'binary',
          description:
            'MP3 audio file (max 10MB) - will be converted to WAV 16kHz, 16-bit, mono',
        },
        referenceText: {
          type: 'string',
          description: 'The correct text that should be spoken',
          example: 'Hello world',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assessment completed successfully',
    type: PronunciationAssessmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or file format',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Assessment failed',
  })
  @UseInterceptors(FileInterceptor('audioFile'))
  async assessPronunciation(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB limit
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: AssessmentDto,
  ): Promise<PronunciationAssessmentResponseDto> {
    const { referenceText } = body;

    // Call service to process assessment
    return this.pronunciationService.assess(file.buffer, referenceText);
  }
}
