import { Test, TestingModule } from '@nestjs/testing';
import { TicketCommentsController } from './ticket-comments.controller';

describe('TicketCommentsController', () => {
  let controller: TicketCommentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketCommentsController],
    }).compile();

    controller = module.get<TicketCommentsController>(TicketCommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
