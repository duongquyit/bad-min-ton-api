import { Injectable } from '@nestjs/common';
import type { AppDto } from './app.dto';

@Injectable()
export class AppService {
  getHello(): AppDto {
    return {
      message: 'Welcome to the Focus Tracker API!',
      timestamp: new Date().toISOString(),
    };
  }
}
