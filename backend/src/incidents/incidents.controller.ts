import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { IncidentsGateway } from './incidents.gateway';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { request } from 'http';

@Controller('incidents')
export class IncidentsController {
  constructor(
    private incidentsService: IncidentsService,
    private incidentsGateway: IncidentsGateway,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.incidentsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: any, @Request() req: any) {
    const incident = await this.incidentsService.create(body, req.user);
    this.incidentsGateway.broadcastNewIncident(incident);
    return incident;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: number) {
    await this.incidentsService.remove(id);
    this.incidentsGateway.broadcastRemoveIncident(id);
    return { message: 'Incident removed' };
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  async incrementReport(@Param('id') id: number) {
    return this.incidentsService.incrementReportCount(id);
  }
}
