import { Module } from '@nestjs/common';
import { ShuttlecocksController } from './shuttlecocks.controller';
import { ShuttlecocksRepository } from './shuttlecocks.repository';
import { ShuttlecocksService } from './shuttlecocks.service';

@Module({
  controllers: [ShuttlecocksController],
  providers: [ShuttlecocksService, ShuttlecocksRepository],
  exports: [ShuttlecocksRepository],
})
export class ShuttlecocksModule {}
