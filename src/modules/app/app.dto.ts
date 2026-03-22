import { IsString } from 'class-validator';

export class AppDto {
  @IsString()
  message: string;

  @IsString()
  timestamp: string;
}
