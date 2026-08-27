/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './incident.entity';
import { IncidentVote } from './incident-vote.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import axios from 'axios';

@Injectable()
export class IncidentsService {
  notFound = new NotFoundException('Incident not found');
  constructor(
    @InjectRepository(Incident)
    private incidentsRepository: Repository<Incident>,
    @InjectRepository(IncidentVote)
    private incidentVotesRepository: Repository<IncidentVote>,
  ) {}

  async findAll(userId: number): Promise<
    (Incident & {
      userHasReported: boolean;
      userHasResolved: boolean;
    })[]
  > {
    const incidents = await this.incidentsRepository.find({
      where: { status: 'active' },
      relations: { reportedBy: true },
      select: {
        reportedBy: {
          id: true,
          username: true,
          profile_image: true,
        },
      },
    });
    const votes = await this.incidentVotesRepository.find({
      where: { userId },
    });
    const reported = new Set(
      votes
        .filter((vote) => vote.type === 'report')
        .map((vote) => vote.incidentId),
    );
    const resolved = new Set(
      votes
        .filter((vote) => vote.type === 'resolve')
        .map((vote) => vote.incidentId),
    );
    return incidents.map((incident) => ({
      ...incident,
      userHasReported: reported.has(incident.id),
      userHasResolved: resolved.has(incident.id),
    }));
  }

  async findResolved(): Promise<Incident[]> {
    return this.incidentsRepository.find({
      where: { status: 'resolved' },
      relations: { reportedBy: true },
      select: {
        reportedBy: { id: true, username: true, profile_image: true },
      },
      order: { resolvedAt: 'DESC' },
    });
  }

  async findForAdministrator(): Promise<Incident[]> {
    return this.incidentsRepository.find({
      relations: { reportedBy: true },
      select: {
        reportedBy: { id: true, username: true, profile_image: true },
      },
      order: { status: 'ASC', createdAt: 'DESC' },
    });
  }

  async removeDescription(id: number): Promise<Incident> {
    const incident = await this.incidentsRepository.findOne({ where: { id } });
    if (!incident) throw this.notFound;
    incident.description = null;
    return this.incidentsRepository.save(incident);
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

  async incrementReportCount(
    id: number,
    userId: number,
  ): Promise<Incident & { userHasReported: true }> {
    const incident = await this.incidentsRepository.findOne({ where: { id } });
    if (!incident) throw this.notFound;
    await this.addVote(id, userId, 'report');
    incident.reportCount += 1;
    const saved = await this.incidentsRepository.save(incident);
    return { ...saved, userHasReported: true };
  }

  private async getAddress(lat: number, lon: number): Promise<string | null> {
    try {
      const response = await axios.get<{ display_name: string }>(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'User-Agent': 'IncidentReporter/1.0' } },
      );
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
    userId: number,
    role: UserRole,
  ): Promise<{
    removed: boolean;
    resolveCount: number;
    userHasResolved: true;
  }> {
    const incident = await this.incidentsRepository.findOne({ where: { id } });
    if (!incident) throw this.notFound;

    await this.addVote(id, userId, 'resolve');
    incident.resolveCount += 1;

    if (role === UserRole.POLICE || incident.resolveCount >= 3) {
      incident.status = 'resolved';
      incident.resolvedAt = new Date();
      await this.incidentsRepository.save(incident);
      return {
        removed: true,
        resolveCount: incident.resolveCount,
        userHasResolved: true,
      };
    }

    await this.incidentsRepository.save(incident);
    return {
      removed: false,
      resolveCount: incident.resolveCount,
      userHasResolved: true,
    };
  }

  private async addVote(
    incidentId: number,
    userId: number,
    type: IncidentVote['type'],
  ): Promise<void> {
    const existingVote = await this.incidentVotesRepository.findOne({
      where: { incidentId, userId, type },
    });
    if (existingVote) {
      throw new ConflictException('You have already voted on this incident');
    }

    await this.incidentVotesRepository.save(
      this.incidentVotesRepository.create({ incidentId, userId, type }),
    );
  }
}
