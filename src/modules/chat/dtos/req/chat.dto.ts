import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsBoolean()
  isTranslation?: boolean; // true nếu yêu cầu dịch từ
}
