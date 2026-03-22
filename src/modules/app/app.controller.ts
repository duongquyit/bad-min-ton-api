import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ResponseHelper } from 'src/common/helpers/response.helper';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return ResponseHelper.ok(this.appService.getHello());
  }
}
