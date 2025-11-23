import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ChatRequestDto } from './dtos/req/chat.dto';
import { ChatResponseDto } from './dtos/res/chat-response.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
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

  async sendMessage(
    userId: number,
    dto: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    // Lấy lịch sử chat gần đây (10 tin nhắn cuối)
    const history = await this.prisma.chatHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Đảo ngược để có thứ tự đúng (cũ -> mới)
    const messages = history.reverse().map((h) => ({
      role: h.role,
      content: h.content,
    }));

    // Thêm tin nhắn hiện tại
    messages.push({
      role: 'user',
      content: dto.message,
    });

    let aiResponse: string;
    let translation: ChatResponseDto['translation'];

    // Tự động phát hiện yêu cầu dịch
    if (this.isTranslationRequest(dto.message)) {
      const word = this.extractWord(dto.message);
      translation = await this.translateWord(word);
      aiResponse = this.formatTranslationResponse(translation);
    } else {
      // Gọi AI với lịch sử
      aiResponse = await this.callAI(messages);
    }

    // Lưu lịch sử
    await this.prisma.chatHistory.createMany({
      data: [
        { userId, role: 'user', content: dto.message },
        { userId, role: 'ai', content: aiResponse },
      ],
    });

    return {
      response: aiResponse,
      translation,
    };
  }

  private isTranslationRequest(message: string): boolean {
    const patterns = [
      /what (is|does) .+ mean/i,
      /nghĩa của .+ là gì/i,
      /nghĩa .+/i,
      /dịch .+/i,
      /translate .+/i,
      /.+ nghĩa là gì/i,
      /.+ là gì/i,
      /^[a-zA-Z]+$/i, // Từ đơn tiếng Anh
      /^[\u00C0-\u1EF9\s]+$/i, // Từ tiếng Việt (có dấu)
    ];
    return patterns.some((pattern) => pattern.test(message.trim()));
  }

  private extractWord(message: string): string {
    const msg = message.trim();
    // Nếu có từ khóa, lấy từ sau từ khóa
    const match = msg.match(
      /(?:nghĩa của|nghĩa|dịch|translate|mean)\s+["']?([\w\u00C0-\u1EF9\s]+)["']?/i,
    );
    if (match) return match[1].trim();

    // Nếu là câu hỏi "X là gì", lấy X
    const isWhatMatch = msg.match(
      /^([\w\u00C0-\u1EF9\s]+)\s+(là gì|nghĩa là gì)/i,
    );
    if (isWhatMatch) return isWhatMatch[1].trim();

    // Nếu chỉ là 1 từ đơn, lấy luôn
    if (msg.split(/\s+/).length <= 2) return msg;

    return msg;
  }

  private async translateWord(
    word: string,
  ): Promise<ChatResponseDto['translation']> {
    // Gọi AI để dịch từ - CHỈ TRẢ NGHĨA CỰC NGẮN GỌN
    const prompt = `You are a dictionary. Translate "${word}" to ${this.isVietnamese(word) ? 'English' : 'Vietnamese'}.

CRITICAL: Reply with ONLY 1-3 words translation. NO explanations, NO examples, NO extra text.

Examples:
Input: "bike" → Output: "xe đạp"
Input: "xe đạp" → Output: "bicycle"
Input: "hello" → Output: "xin chào"
Input: "apple" → Output: "quả táo"`;

    const aiResponse = await this.callAI([{ role: 'user', content: prompt }]);

    // Làm sạch response - chỉ giữ lại nghĩa thuần túy
    let cleanResponse = aiResponse
      .trim()
      .replace(/^["'`()\[\]{}]|["'`()\[\]{}]$/g, '') // Bỏ mọi dấu bao quanh
      .replace(/^(Output:|Answer:|Translation:)\s*/i, '') // Bỏ prefix
      .split(/[.\n]/)[0] // Chỉ lấy trước dấu chấm hoặc xuống dòng
      .trim();

    // Nếu vẫn dài, chỉ lấy 3 từ đầu
    const words = cleanResponse.split(/\s+/);
    if (words.length > 3) {
      cleanResponse = words.slice(0, 3).join(' ');
    }

    return {
      word,
      meaning: cleanResponse,
    };
  }

  private isVietnamese(text: string): boolean {
    // Kiểm tra có ký tự tiếng Việt không
    return /[\u00C0-\u1EF9]/.test(text);
  }

  private formatTranslationResponse(
    translation: ChatResponseDto['translation'],
  ): string {
    if (!translation) return '';
    // Format đơn giản: "bike: xe đạp"
    return `${translation.word}: ${translation.meaning}`;
  }

  private async callAI(
    messages: { role: string; content: string }[],
  ): Promise<string> {
    try {
      // Tạo prompt từ lịch sử tin nhắn
      const conversationHistory = messages
        .map(
          (msg) =>
            `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`,
        )
        .join('\n');

      const result = await this.model.generateContent(conversationHistory);
      const response = result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Error calling AI with history:', error);
      return 'Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn. Hãy thử lại nhé!';
    }
  }

  async getChatHistory(userId: number, limit = 50) {
    return this.prisma.chatHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async clearChatHistory(userId: number) {
    await this.prisma.chatHistory.deleteMany({
      where: { userId },
    });
  }
}
