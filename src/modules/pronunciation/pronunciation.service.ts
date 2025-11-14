import { Injectable, Logger } from '@nestjs/common';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import { Readable } from 'stream';
import { PronunciationAssessmentResponseDto } from './dto/res/pronunciation';

@Injectable()
export class PronunciationService {
  private readonly logger = new Logger(PronunciationService.name);

  constructor() {
    // Set ffmpeg path to the binary from @ffmpeg-installer/ffmpeg package
    ffmpeg.setFfmpegPath(ffmpegPath);
    this.logger.log(`FFmpeg path set to: ${ffmpegPath}`);
  }

  /**
   * Convert audio buffer (MP3, WebM, OGG, etc.) to WAV buffer (16kHz, 16-bit, mono)
   * Required format for Azure Speech SDK
   * FFmpeg will automatically detect the input format
   */
  private async convertAudioToWav(audioBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const readableStream = new Readable();
      readableStream.push(audioBuffer);
      readableStream.push(null);

      ffmpeg(readableStream)
        .toFormat('wav')
        .audioFrequency(16000) // 16kHz
        .audioChannels(1) // Mono
        .audioBitrate('256k') // 16-bit
        .on('error', (err: Error) => {
          this.logger.error(`FFmpeg conversion error: ${err.message}`);
          reject(new Error(`Audio conversion failed: ${err.message}`));
        })
        .on('end', () => {
          this.logger.log('Audio to WAV conversion completed');
          resolve(Buffer.concat(chunks));
        })
        .pipe()
        .on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
    });
  }

  async assess(
    audioBuffer: Buffer,
    referenceText: string,
  ): Promise<PronunciationAssessmentResponseDto> {
    try {
      // 1. Convert audio to WAV (16kHz, 16-bit, mono) - supports MP3, WebM, OGG, etc.
      this.logger.log('Converting audio to WAV format...');
      const wavBuffer = await this.convertAudioToWav(audioBuffer);

      // 2. Cấu hình kết nối Azure (Lấy từ .env)
      const speechKey = process.env.AZURE_SPEECH_KEY;
      const speechRegion = process.env.AZURE_SPEECH_REGION;

      if (!speechKey || !speechRegion) {
        throw new Error('Azure Speech credentials are not configured');
      }

      const speechConfig = sdk.SpeechConfig.fromSubscription(
        speechKey,
        speechRegion,
      );

      // 3. Cấu hình định dạng âm thanh
      // Sử dụng format mặc định (WAV 16kHz, 16-bit, mono)
      const pushStream = sdk.AudioInputStream.createPushStream();

      // Đẩy WAV buffer vào stream
      // Chuyển đổi Node.js Buffer sang ArrayBuffer một cách an toàn
      const arrayBuffer = wavBuffer.buffer.slice(
        wavBuffer.byteOffset,
        wavBuffer.byteOffset + wavBuffer.byteLength,
      ) as ArrayBuffer;

      pushStream.write(arrayBuffer);
      pushStream.close();

      // 4. Cấu hình AudioConfig từ stream
      const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

      // 5. Cấu hình chấm điểm phát âm
      const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
        referenceText,
        sdk.PronunciationAssessmentGradingSystem.HundredMark,
        sdk.PronunciationAssessmentGranularity.Phoneme,
        true, // Tự động phát hiện lỗi sai
      );

      // 6. Khởi tạo Recognizer
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
      pronunciationConfig.applyTo(recognizer);

      // 7. Bắt đầu nhận diện và trả về kết quả (dưới dạng Promise)
      return new Promise<PronunciationAssessmentResponseDto>(
        (resolve, reject) => {
          recognizer.recognizeOnceAsync(
            // (SỬA LỖI 2) - Type đúng là SpeechRecognitionResult
            (result: sdk.SpeechRecognitionResult) => {
              if (result.reason === sdk.ResultReason.RecognizedSpeech) {
                const assessment =
                  sdk.PronunciationAssessmentResult.fromResult(result);

                // Map SDK result to DTO (Code của bạn rất tốt)
                const response: PronunciationAssessmentResponseDto = {
                  success: true,
                  accuracy: assessment.accuracyScore,
                  fluency: assessment.fluencyScore,
                  completeness: assessment.completenessScore,
                  prosody: assessment.prosodyScore,
                  overall: assessment.pronunciationScore,
                  recognizedText: result.text,
                  words: assessment.detailResult?.Words?.map((word) => ({
                    word: word.Word,
                    accuracy: word.PronunciationAssessment?.AccuracyScore ?? 0,
                    errorType: word.PronunciationAssessment?.ErrorType,
                  })),
                  rawResult: JSON.parse(JSON.stringify(assessment)) as Record<
                    string,
                    any
                  >,
                };

                this.logger.log(
                  `Assessment completed for: "${referenceText}" with overall score: ${response.overall}`,
                );
                resolve(response);
              } else {
                this.logger.error(`Recognition failed: ${result.errorDetails}`);
                resolve({
                  success: false,
                  error: `Không thể nhận diện: ${result.errorDetails}`,
                });
              }
              recognizer.close();
            },
            (err: string) => {
              this.logger.error(`SDK error: ${err}`);
              reject(new Error(`Lỗi SDK: ${err}`));
              recognizer.close();
            },
          );
        },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Assessment error: ${errorMessage}`, errorStack);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
