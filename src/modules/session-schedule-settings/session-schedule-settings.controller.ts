import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import {
  CreateSessionScheduleSettingDto,
  GetActiveScheduleQueryDto,
  ListSessionScheduleSettingsQueryDto,
  UpdateSessionScheduleSettingDto,
} from './session-schedule-settings.dto';
import { SessionScheduleSettingsService } from './session-schedule-settings.service';

@Controller('session-schedule-settings')
export class SessionScheduleSettingsController {
  constructor(private readonly scheduleService: SessionScheduleSettingsService) {}

  @Get()
  async list(@Query() query: ListSessionScheduleSettingsQueryDto) {
    const { items, pagination } = await this.scheduleService.list(query);
    return ResponseHelper.list(items, pagination);
  }

  @Post()
  async create(@Body() dto: CreateSessionScheduleSettingDto) {
    const schedule = await this.scheduleService.create(dto);
    return ResponseHelper.created(schedule);
  }

  @Get('active')
  async findActive(@Query() query: GetActiveScheduleQueryDto) {
    const schedule = await this.scheduleService.findActive(query);
    return ResponseHelper.ok(schedule);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSessionScheduleSettingDto) {
    const schedule = await this.scheduleService.update(id, dto);
    return ResponseHelper.ok(schedule);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.scheduleService.remove(id);
    return ResponseHelper.noContent();
  }
}
