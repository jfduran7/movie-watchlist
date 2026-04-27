import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Movie } from '@/modules/movies/entities/movie.entity';
import { WatchlistEntry } from '@/modules/watchlist/entities/watchlist-entry.entity';
import { WatchlistService } from '@/modules/watchlist/watchlist.service';
import { AddToWatchlistDto } from '@/modules/watchlist/dto/add-to-watchlist.dto';
import { UpdateWatchlistDto } from '@/modules/watchlist/dto/update-watchlist.dto';
import { WatchlistEntryResponseDto } from '@/modules/watchlist/dto/watchlist-entry-response.dto';
import { MovieResponseDto } from '@/modules/movies/dto/movie-response.dto';

type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const mockEntryRepo = (): MockRepository<WatchlistEntry> => ({
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

const mockMovieRepo = (): MockRepository<Movie> => ({
  findOne: jest.fn(),
});

describe('WatchlistService', () => {
  let service: WatchlistService;
  let entryRepo: MockRepository<WatchlistEntry>;
  let movieRepo: MockRepository<Movie>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchlistService,
        {
          provide: getRepositoryToken(WatchlistEntry),
          useFactory: mockEntryRepo,
        },
        { provide: getRepositoryToken(Movie), useFactory: mockMovieRepo },
      ],
    }).compile();

    service = module.get<WatchlistService>(WatchlistService);
    entryRepo = module.get(getRepositoryToken(WatchlistEntry));
    movieRepo = module.get(getRepositoryToken(Movie));
  });

  const userId = 'user-uuid';
  const movieId = 'movie-uuid';
  const entryId = 'entry-uuid';

  const mockMovie: Movie = {
    id: movieId,
    title: 'Test Movie',
    genre: 'Action',
    releaseYear: 2024,
    description: null,
    posterUrl: null,
  };

  const mockEntry: WatchlistEntry = {
    id: entryId,
    userId,
    movieId,
    status: 'want',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {} as never,
    movie: mockMovie,
  };

  describe('addToWatchlist', () => {
    const dto: AddToWatchlistDto = { movieId, status: 'want' };

    it('creates and returns a watchlist entry when movie exists and no duplicate', async () => {
      movieRepo.findOne!.mockResolvedValue(mockMovie);
      entryRepo.findOne!.mockResolvedValue(null);
      entryRepo.create!.mockReturnValue(mockEntry);
      entryRepo.save!.mockResolvedValue(mockEntry);

      const result = await service.addToWatchlist(userId, dto);

      expect(movieRepo.findOne).toHaveBeenCalledWith({
        where: { id: movieId },
      });
      expect(entryRepo.findOne).toHaveBeenCalledWith({
        where: { userId, movieId },
      });
      expect(entryRepo.create).toHaveBeenCalledWith({
        userId,
        movieId,
        status: 'want',
      });
      expect(result).toEqual({
        id: entryId,
        userId,
        movieId,
        status: 'want',
        createdAt: mockEntry.createdAt,
        updatedAt: mockEntry.updatedAt,
        movie: {
          id: movieId,
          title: 'Test Movie',
          genre: 'Action',
          releaseYear: 2024,
          description: null,
          posterUrl: null,
        },
      });
    });

    it('throws NotFoundException when movie does not exist', async () => {
      movieRepo.findOne!.mockResolvedValue(null);

      await expect(service.addToWatchlist(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(entryRepo.findOne).not.toHaveBeenCalled();
    });

    it('throws ConflictException when entry already exists', async () => {
      movieRepo.findOne!.mockResolvedValue(mockMovie);
      entryRepo.findOne!.mockResolvedValue(mockEntry);

      await expect(service.addToWatchlist(userId, dto)).rejects.toThrow(
        ConflictException,
      );
      expect(entryRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('updateEntry', () => {
    const dto: UpdateWatchlistDto = { status: 'watched' };

    it('returns updated entry when found for this user', async () => {
      const updatedEntry = { ...mockEntry, status: 'watched' as const };
      entryRepo.findOne!.mockResolvedValue(mockEntry);
      entryRepo.save!.mockResolvedValue(updatedEntry);

      const result = await service.updateEntry(entryId, userId, dto);

      expect(entryRepo.findOne).toHaveBeenCalledWith({
        where: { id: entryId, userId },
      });
      expect(result.status).toBe('watched');
      expect(result).toEqual({
        id: entryId,
        userId,
        movieId,
        status: 'watched',
        createdAt: updatedEntry.createdAt,
        updatedAt: updatedEntry.updatedAt,
        movie: {
          id: movieId,
          title: 'Test Movie',
          genre: 'Action',
          releaseYear: 2024,
          description: null,
          posterUrl: null,
        },
      });
    });

    it('throws NotFoundException when entry not found or belongs to another user', async () => {
      entryRepo.findOne!.mockResolvedValue(null);

      await expect(service.updateEntry(entryId, userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeEntry', () => {
    it('removes entry successfully when found', async () => {
      entryRepo.findOne!.mockResolvedValue(mockEntry);
      entryRepo.remove!.mockResolvedValue(mockEntry);

      await expect(
        service.removeEntry(entryId, userId),
      ).resolves.toBeUndefined();
      expect(entryRepo.findOne).toHaveBeenCalledWith({
        where: { id: entryId, userId },
      });
      expect(entryRepo.remove).toHaveBeenCalledWith(mockEntry);
    });

    it('throws NotFoundException when entry not found', async () => {
      entryRepo.findOne!.mockResolvedValue(null);

      await expect(service.removeEntry(entryId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(entryRepo.remove).not.toHaveBeenCalled();
    });
  });
});
