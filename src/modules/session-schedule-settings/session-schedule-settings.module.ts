import { Module } from '@nestjs/common';
import { SessionScheduleSettingsController } from './session-schedule-settings.controller';
import { SessionScheduleSettingsRepository } from './session-schedule-settings.repository';
import { SessionScheduleSettingsService } from './session-schedule-settings.service';

@Module({
  controllers: [SessionScheduleSettingsController],
  providers: [SessionScheduleSettingsService, SessionScheduleSettingsRepository],
  exports: [SessionScheduleSettingsService],
})
export class SessionScheduleSettingsModule {}
