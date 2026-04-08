import { Controller, Get, Query } from '@nestjs/common';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import { ReportQueryDto } from './reports.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async generate(@Query() query: ReportQueryDto) {
    const report = await this.reportsService.generate(query);
    return ResponseHelper.ok(report);
  }
}
