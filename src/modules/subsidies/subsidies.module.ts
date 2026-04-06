import { Module } from '@nestjs/common';
import { SubsidiesController } from './subsidies.controller';
import { SubsidiesRepository } from './subsidies.repository';
import { SubsidiesService } from './subsidies.service';
import { SubsidyUsagesRepository } from './subsidy-usages.repository';

@Module({
  controllers: [SubsidiesController],
  providers: [SubsidiesService, SubsidiesRepository, SubsidyUsagesRepository],
  exports: [SubsidiesService],
})
export class SubsidiesModule {}
