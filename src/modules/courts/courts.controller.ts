import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import { CreateCourtDto, ListCourtsQueryDto, UpdateCourtDto } from './courts.dto';
import { CourtsService } from './courts.service';

@Controller('courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Get()
  async list(@Query() query: ListCourtsQueryDto) {
    const { items, pagination } = await this.courtsService.list(query);
    return ResponseHelper.list(items, pagination);
  }

  @Post()
  async create(@Body() dto: CreateCourtDto) {
    const court = await this.courtsService.create(dto);
    return ResponseHelper.created(court);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const court = await this.courtsService.findById(id);
    return ResponseHelper.ok(court);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCourtDto) {
    const court = await this.courtsService.update(id, dto);
    return ResponseHelper.ok(court);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.courtsService.remove(id);
    return ResponseHelper.noContent();
  }
}
