import { Test, TestingModule } from '@nestjs/testing';
import { TrackService } from './track.service';

describe('TrackService', () => {
  let provider: TrackService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrackService],
    }).compile();

    provider = module.get<TrackService>(TrackService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
