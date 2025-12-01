export class ChatResponseDto {
  response: string;
  translation?: {
    word: string;
    meaning: string;
    phonetic?: string;
    examples?: string[];
  };
}
