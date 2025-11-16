import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ChatRequestDto {
  @IsNotEmpty({ message: 'Text không được để trống' })
  @IsString({ message: 'Text phải là chuỗi' })
  @MaxLength(1000, { message: 'Text không được vượt quá 1000 ký tự' })
  text: string;
}
