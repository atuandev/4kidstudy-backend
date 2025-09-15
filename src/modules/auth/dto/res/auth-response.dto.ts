import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';
import { TokensResponseDto } from './tokens-response.dto';

export class AuthResponseDto {
  @ApiProperty()
  user: UserResponseDto;

  @ApiProperty()
  tokens: TokensResponseDto;
}
