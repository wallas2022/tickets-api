import { Test, TestingModule } from '@nestjs/testing';
import { TicketCommentsService } from './ticket-comments.service';

describe('TicketCommentsService', () => {
  let service: TicketCommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TicketCommentsService],
    }).compile();

    service = module.get<TicketCommentsService>(TicketCommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
