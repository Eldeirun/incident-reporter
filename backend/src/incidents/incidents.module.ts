import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Incident } from './incident.entity';
import { IncidentsGateway } from './incidents.gateway';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Incident])],
  providers: [IncidentsGateway, IncidentsService],
  controllers: [IncidentsController],
  exports: [IncidentsGateway],
})
export class IncidentsModule {}
