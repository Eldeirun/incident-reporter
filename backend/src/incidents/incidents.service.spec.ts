import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsService } from './incidents.service';

describe('IncidentsService', () => {
  let service: IncidentsService;
  const incidentsRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
  };
  const incidentVotesRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((vote: object) => vote),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        { provide: 'IncidentRepository', useValue: incidentsRepository },
        {
          provide: 'IncidentVoteRepository',
          useValue: incidentVotesRepository,
        },
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects a second report vote from the same account', async () => {
    incidentsRepository.findOne.mockResolvedValue({ id: 7, reportCount: 1 });
    incidentVotesRepository.findOne.mockResolvedValue({
      incidentId: 7,
      userId: 11,
      type: 'report',
    });

    await expect(service.incrementReportCount(7, 11)).rejects.toThrow(
      'You have already voted on this incident',
    );
    expect(incidentsRepository.save).not.toHaveBeenCalled();
  });

  it('updates and clears a police-only description', async () => {
    const incident = { id: 7, policeDescription: null };
    incidentsRepository.findOne.mockResolvedValue(incident);
    incidentsRepository.save.mockResolvedValue(incident);

    await expect(
      service.updatePoliceDescription(7, '  Road is blocked by debris  '),
    ).resolves.toEqual({ message: 'Police description updated' });
    expect(incident.policeDescription).toBe('Road is blocked by debris');

    await service.updatePoliceDescription(7, '   ');
    expect(incident.policeDescription).toBeNull();
  });
});
