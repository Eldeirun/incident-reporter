import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './incident.entity';
import { User } from '../users/user.entity';

@Injectable()
export class IncidentsService {
  notFound = new NotFoundException('Incident not found');
  constructor(
    @InjectRepository(Incident)
    private incidentsRepository: Repository<Incident>,
  ) {}

  async findAll(): Promise<Incident[]> {
    return this.incidentsRepository.find();
  }

  async create(data: Partial<Incident>, user: User): Promise<Incident> {
    const incident = this.incidentsRepository.create({
      ...data,
      reportedBy: user,
    });
    return this.incidentsRepository.save(incident);
  }

  async remove(id: number): Promise<void> {
    const incident = await this.incidentsRepository.findOne({ where: { id } });
    if (!incident) throw this.notFound;
    await this.incidentsRepository.remove(incident);
  }

  async incrementReportCount(id: number): Promise<Incident> {
    const incident = await this.incidentsRepository.findOne({ where: { id } });
    if (!incident) throw this.notFound;
    incident.reportCount += 1;
    return this.incidentsRepository.save(incident);
  }
}
