import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import { CreateShuttlecockDto, ListShuttlecocksQueryDto, UpdateShuttlecockDto } from './shuttlecocks.dto';
import { ShuttlecocksService } from './shuttlecocks.service';

@Controller('shuttlecocks')
export class ShuttlecocksController {
  constructor(private readonly shuttlecocksService: ShuttlecocksService) {}

  @Get()
  async list(@Query() query: ListShuttlecocksQueryDto) {
    const { items, pagination } = await this.shuttlecocksService.list(query);
    return ResponseHelper.list(items, pagination);
  }

  @Post()
  async create(@Body() dto: CreateShuttlecockDto) {
    const shuttlecock = await this.shuttlecocksService.create(dto);
    return ResponseHelper.created(shuttlecock);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const shuttlecock = await this.shuttlecocksService.findById(id);
    return ResponseHelper.ok(shuttlecock);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateShuttlecockDto) {
    const shuttlecock = await this.shuttlecocksService.update(id, dto);
    return ResponseHelper.ok(shuttlecock);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.shuttlecocksService.remove(id);
    return ResponseHelper.noContent();
  }
}
