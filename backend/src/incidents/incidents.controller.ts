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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const incident = await this.incidentsService.create(body, req.user);
    const fullIncident = await this.incidentsService.findOne(incident.id);
    this.incidentsGateway.broadcastNewIncident(incident);
    return fullIncident;
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
    const incident = await this.incidentsService.incrementReportCount(id);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.incidentsGateway.broadcastReportCount(id, incident.reportCount);
    return incident;
  }

  @Post(':id/resolve')
  @UseGuards(JwtAuthGuard)
  async resolve(@Param('id') id: number) {
    const result = await this.incidentsService.resolve(id);
    if (result.removed) {
      this.incidentsGateway.broadcastRemoveIncident(id);
    } else {
      this.incidentsGateway.broadcastResolveVote(id, result.resolveCount);
    }
    return result;
  }
}
