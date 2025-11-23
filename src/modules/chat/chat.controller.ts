import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Delete,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dtos/req';
import { ChatResponseDto } from './dtos/res';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(
    @Req() req: any,
    @Body() dto: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    return this.chatService.sendMessage(req.user.id, dto);
  }

  @Get('history')
  async getHistory(@Req() req: any) {
    return this.chatService.getChatHistory(req.user.id);
  }

  @Delete('history')
  async clearHistory(@Req() req: any) {
    return this.chatService.clearChatHistory(req.user.id);
  }
}
