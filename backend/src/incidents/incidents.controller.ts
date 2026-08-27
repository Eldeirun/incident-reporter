import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { IncidentsGateway } from './incidents.gateway';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user-role.enum';

interface AuthenticatedRequest {
  user: { id: number; role: UserRole };
}

@Controller('incidents')
export class IncidentsController {
  constructor(
    private incidentsService: IncidentsService,
    private incidentsGateway: IncidentsGateway,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req: AuthenticatedRequest) {
    return this.incidentsService.findAll(req.user.id);
  }

  @Get('resolved')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  findResolved() {
    return this.incidentsService.findResolved();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  findForAdministrator() {
    return this.incidentsService.findForAdministrator();
  }

  @Patch(':id/description')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  removeDescription(@Param('id') id: number) {
    return this.incidentsService.removeDescription(id);
  }

  @Patch(':id/police-description')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.POLICE)
  updatePoliceDescription(
    @Param('id') id: number,
    @Body() body: { policeDescription?: string | null },
  ) {
    return this.incidentsService.updatePoliceDescription(
      id,
      body.policeDescription,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.POLICE)
  async create(@Body() body: any, @Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const incident = await this.incidentsService.create(body, req.user);
    const fullIncident = await this.incidentsService.findOne(incident.id);
    this.incidentsGateway.broadcastNewIncident(incident);
    return fullIncident;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.POLICE)
  async remove(@Param('id') id: number) {
    await this.incidentsService.remove(id);
    this.incidentsGateway.broadcastRemoveIncident(id);
    return { message: 'Incident removed' };
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.POLICE)
  async incrementReport(
    @Param('id') id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    const incident = await this.incidentsService.incrementReportCount(
      id,
      req.user.id,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.incidentsGateway.broadcastReportCount(id, incident.reportCount);
    return incident;
  }

  @Post(':id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.POLICE)
  async resolve(@Param('id') id: number, @Request() req: AuthenticatedRequest) {
    const result = await this.incidentsService.resolve(
      id,
      req.user.id,
      req.user.role,
    );
    if (result.removed) {
      this.incidentsGateway.broadcastRemoveIncident(id);
    } else {
      this.incidentsGateway.broadcastResolveVote(id, result.resolveCount);
    }
    return result;
  }
}
