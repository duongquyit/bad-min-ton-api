import { Module } from '@nestjs/common';
import { CourtsModule } from 'src/modules/courts/courts.module';
import { ShuttlecocksModule } from 'src/modules/shuttlecocks/shuttlecocks.module';
import { SessionScheduleSettingsModule } from 'src/modules/session-schedule-settings/session-schedule-settings.module';
import { SubsidiesModule } from 'src/modules/subsidies/subsidies.module';
import { UsersModule } from 'src/modules/users/users.module';
import { SessionParticipantsRepository } from './session-participants.repository';
import { SessionShuttlecockSnapshotsRepository } from './session-shuttlecock-snapshots.repository';
import { SessionSnapshotsRepository } from './session-snapshots.repository';
import { SessionUserSnapshotsRepository } from './session-user-snapshots.repository';
import { SessionsController } from './sessions.controller';
import { SessionsRepository } from './sessions.repository';
import { SessionsService } from './sessions.service';

@Module({
  imports: [UsersModule, CourtsModule, ShuttlecocksModule, SubsidiesModule, SessionScheduleSettingsModule],
  controllers: [SessionsController],
  providers: [
    SessionsService,
    SessionsRepository,
    SessionParticipantsRepository,
    SessionShuttlecockSnapshotsRepository,
    SessionSnapshotsRepository,
    SessionUserSnapshotsRepository,
  ],
  exports: [SessionsService],
})
export class SessionsModule {}
