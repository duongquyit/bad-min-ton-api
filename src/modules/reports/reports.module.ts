import { Module } from '@nestjs/common';
import { SessionsModule } from 'src/modules/sessions/sessions.module';
import { UsersModule } from 'src/modules/users/users.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [SessionsModule, UsersModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
