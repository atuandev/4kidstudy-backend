import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not configured');
      throw new Error(
        'GEMINI_API_KEY is not configured in environment variables',
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey);

    // Khởi tạo model với system instruction
    // Sử dụng gemini-2.0-flash - nhanh, ổn định và có sẵn
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: `You are a friendly AI assistant named 'Gem', helping elementary school students (grades 1-5) learn English.

IMPORTANT RULES:
1. Always respond in ENGLISH first (2-3 short sentences)
2. Then provide a brief Vietnamese explanation in parentheses
3. Use simple, age-appropriate language
4. Be encouraging and positive
5. Keep responses concise and fun

Example format:
"Hello! Nice to meet you! 😊 (Xin chào! Rất vui được gặp bạn!)"
"The word 'cat' means a small animal. (Từ 'cat' có nghĩa là con mèo.)"`,
    });

    this.logger.log('ChatService initialized with gemini-2.0-flash');
    this.logger.warn(
      'IMPORTANT: Your API key cannot access models via v1beta API. Please get a new API key from https://aistudio.google.com/app/apikey',
    );
  }

  async generateText(prompt: string): Promise<string> {
    try {
      this.logger.log(`Generating text for prompt: ${prompt}`);

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Error calling Gemini API:', error);
      return 'Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn. Hãy thử lại nhé!';
    }
  }
}
