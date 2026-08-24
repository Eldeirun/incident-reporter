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
});
