import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import { CreateSubsidyDto, ListSubsidiesQueryDto, UpdateSubsidyDto } from './subsidies.dto';
import { SubsidiesService } from './subsidies.service';

@Controller('subsidies')
export class SubsidiesController {
  constructor(private readonly subsidiesService: SubsidiesService) {}

  @Get()
  async list(@Query() query: ListSubsidiesQueryDto) {
    const { items, pagination } = await this.subsidiesService.list(query);
    return ResponseHelper.list(items, pagination);
  }

  @Post()
  async create(@Body() dto: CreateSubsidyDto) {
    const subsidy = await this.subsidiesService.create(dto);
    return ResponseHelper.created(subsidy);
  }

  @Get('month/:month')
  async findByMonth(@Param('month') month: string) {
    const subsidy = await this.subsidiesService.findByMonth(month);
    return ResponseHelper.ok(subsidy);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const subsidy = await this.subsidiesService.findById(id);
    return ResponseHelper.ok(subsidy);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSubsidyDto) {
    const subsidy = await this.subsidiesService.update(id, dto);
    return ResponseHelper.ok(subsidy);
  }
}
