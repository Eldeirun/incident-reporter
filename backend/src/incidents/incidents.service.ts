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

type PublicIncident = Omit<Incident, 'policeDescription'>;

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
    (PublicIncident & {
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
      ...this.toPublicIncident(incident),
      userHasReported: reported.has(incident.id),
      userHasResolved: resolved.has(incident.id),
    }));
  }

  async findResolved(): Promise<PublicIncident[]> {
    const incidents = await this.incidentsRepository.find({
      where: { status: 'resolved' },
      relations: { reportedBy: true },
      select: {
        reportedBy: { id: true, username: true, profile_image: true },
      },
      order: { resolvedAt: 'DESC' },
    });
    return incidents.map((incident) => this.toPublicIncident(incident));
  }

  async findForAdministrator(): Promise<PublicIncident[]> {
    const incidents = await this.incidentsRepository.find({
      relations: { reportedBy: true },
      select: {
        reportedBy: { id: true, username: true, profile_image: true },
      },
      order: { status: 'ASC', createdAt: 'DESC' },
    });
    return incidents.map((incident) => this.toPublicIncident(incident));
  }

  async removeDescription(id: number): Promise<PublicIncident> {
    const incident = await this.incidentsRepository.findOne({ where: { id } });
    if (!incident) throw this.notFound;
    incident.description = null;
    const saved = await this.incidentsRepository.save(incident);
    return this.toPublicIncident(saved);
  }

  async updatePoliceDescription(
    id: number,
    policeDescription?: string | null,
  ): Promise<{ message: string }> {
    const incident = await this.incidentsRepository.findOne({ where: { id } });
    if (!incident) throw this.notFound;

    incident.policeDescription = policeDescription?.trim() || null;
    await this.incidentsRepository.save(incident);
    return { message: 'Police description updated' };
  }

  async create(data: Partial<Incident>, user: User): Promise<Incident> {
    const address = await this.getAddress(Number(data.lat), Number(data.lon));
    const incident = this.incidentsRepository.create({
      ...data,
      policeDescription: null,
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
  ): Promise<PublicIncident & { userHasReported: true }> {
    const incident = await this.incidentsRepository.findOne({ where: { id } });
    if (!incident) throw this.notFound;
    await this.addVote(id, userId, 'report');
    incident.reportCount += 1;
    const saved = await this.incidentsRepository.save(incident);
    return { ...this.toPublicIncident(saved), userHasReported: true };
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

  async findOne(id: number): Promise<PublicIncident | null> {
    const incident = await this.incidentsRepository.findOne({
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
    return incident ? this.toPublicIncident(incident) : null;
  }

  private toPublicIncident(incident: Incident): PublicIncident {
    const publicIncident = { ...incident } as Partial<Incident>;
    delete publicIncident.policeDescription;
    return publicIncident as PublicIncident;
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
