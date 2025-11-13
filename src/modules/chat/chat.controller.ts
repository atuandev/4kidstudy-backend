import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatDto } from './dtos/req';
import { ChatResponseDto } from './dtos/res';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async getAiResponse(@Body() chatDto: ChatDto): Promise<ChatResponseDto> {
    const aiText = await this.chatService.generateText(chatDto.text);
    return { text: aiText };
  }
}
