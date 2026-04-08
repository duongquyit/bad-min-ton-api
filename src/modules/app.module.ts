import * as path from 'path';
import { Module, OnModuleInit } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { seconds, ThrottlerModule } from '@nestjs/throttler';
import { AcceptLanguageResolver, I18nModule, I18nService } from 'nestjs-i18n';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { HealthModule } from './health/health.module';
import { HttpExceptionFilter } from '../common/exceptions/error-handler';
import { setI18nInstance } from '../common/i18n';
import { UsersModule } from './users/users.module';
import { CourtsModule } from './courts/courts.module';
import { ShuttlecocksModule } from './shuttlecocks/shuttlecocks.module';
import { SubsidiesModule } from './subsidies/subsidies.module';
import { SessionsModule } from './sessions/sessions.module';
import { SessionScheduleSettingsModule } from './session-schedule-settings/session-schedule-settings.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: seconds(60), limit: 100 }]),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '../i18n/'),
        watch: process.env.NODE_ENV === 'development',
      },
      resolvers: [AcceptLanguageResolver],
    }),
    HealthModule,
    UsersModule,
    CourtsModule,
    ShuttlecocksModule,
    SubsidiesModule,
    SessionsModule,
    SessionScheduleSettingsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly i18n: I18nService) {}

  onModuleInit(): void {
    setI18nInstance(this.i18n);
  }
}
