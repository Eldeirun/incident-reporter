/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './incident.entity';
import { User } from '../users/user.entity';
import axios from 'axios';

@Injectable()
export class IncidentsService {
  notFound = new NotFoundException('Incident not found');
  constructor(
    @InjectRepository(Incident)
    private incidentsRepository: Repository<Incident>,
  ) {}

  async findAll(): Promise<Incident[]> {
    return this.incidentsRepository.find({
      relations: { reportedBy: true },
      select: {
        reportedBy: {
          id: true,
          username: true,
          profile_image: true,
        },
      },
    });
  }

  async create(data: Partial<Incident>, user: User): Promise<Incident> {
    const address = await this.getAddress(Number(data.lat), Number(data.lon));
    const incident = this.incidentsRepository.create({
      ...data,
      reportedBy: user,
      address: address ?? undefined,
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

  private async getAddress(lat: number, lon: number): Promise<string | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const response = (await axios.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'User-Agent': 'IncidentReporter/1.0' } },
      )) as { data: { display_name: string } };
      console.log('Geocoding response:', response.data.display_name);
      return response.data.display_name || null;
    } catch (err) {
      console.log('Geocoding error:', err);
      return null;
    }
  }

  async findOne(id: number): Promise<Incident | null> {
    return this.incidentsRepository.findOne({
      where: { id },
      relations: { reportedBy: true },
      select: {
        reportedBy: {
          id: true,
          username: true,
          profile_image: true,
        },
      },
    });
  }

  async resolve(
    id: number,
  ): Promise<{ removed: boolean; resolveCount: number }> {
    const incident = await this.incidentsRepository.findOne({ where: { id } });
    if (!incident) throw this.notFound;

    incident.resolveCount += 1;

    if (incident.resolveCount >= 3) {
      await this.incidentsRepository.remove(incident);
      return { removed: true, resolveCount: incident.resolveCount };
    }

    await this.incidentsRepository.save(incident);
    return { removed: false, resolveCount: incident.resolveCount };
  }
}
