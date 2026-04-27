import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { Movie } from '@/modules/movies/entities/movie.entity';
import { Review } from '@/modules/reviews/entities/review.entity';
import { MovieResponseDto } from '@/modules/movies/dto/movie-response.dto';
import { ReviewResponseDto } from '@/modules/reviews/dto/review-response.dto';

describe('MoviesService', () => {
  let service: MoviesService;
  const mockMovieRepo = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
  };
  const mockReviewRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        { provide: getRepositoryToken(Movie), useValue: mockMovieRepo },
        { provide: getRepositoryToken(Review), useValue: mockReviewRepo },
      ],
    }).compile();
    service = module.get<MoviesService>(MoviesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated movies with no filters', async () => {
      const mockMovies: Movie[] = [
        {
          id: '1',
          title: 'Movie 1',
          genre: 'Action',
          releaseYear: 2020,
          description: 'Description 1',
          posterUrl: 'http://example.com/poster1.jpg',
        },
        {
          id: '2',
          title: 'Movie 2',
          genre: 'Drama',
          releaseYear: 2021,
          description: 'Description 2',
          posterUrl: 'http://example.com/poster2.jpg',
        },
      ];
      mockMovieRepo.findAndCount.mockResolvedValue([mockMovies, 2]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: [
          {
            id: '1',
            title: 'Movie 1',
            genre: 'Action',
            releaseYear: 2020,
            description: 'Description 1',
            posterUrl: 'http://example.com/poster1.jpg',
          },
          {
            id: '2',
            title: 'Movie 2',
            genre: 'Drama',
            releaseYear: 2021,
            description: 'Description 2',
            posterUrl: 'http://example.com/poster2.jpg',
          },
        ],
        meta: { total: 2, page: 1, limit: 10 },
      });
      expect(mockMovieRepo.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        order: { title: 'ASC' },
      });
    });

    it('should filter movies by genre', async () => {
      const mockMovies: Movie[] = [
        {
          id: '1',
          title: 'Action Movie',
          genre: 'Action',
          releaseYear: 2020,
          description: 'Description 1',
          posterUrl: 'http://example.com/poster1.jpg',
        },
      ];
      mockMovieRepo.findAndCount.mockResolvedValue([mockMovies, 1]);

      const result = await service.findAll({
        genre: 'Action',
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        data: [
          {
            id: '1',
            title: 'Action Movie',
            genre: 'Action',
            releaseYear: 2020,
            description: 'Description 1',
            posterUrl: 'http://example.com/poster1.jpg',
          },
        ],
        meta: { total: 1, page: 1, limit: 10 },
      });
      expect(mockMovieRepo.findAndCount).toHaveBeenCalledWith({
        where: { genre: 'Action' },
        skip: 0,
        take: 10,
        order: { title: 'ASC' },
      });
    });

    it('should apply pagination correctly', async () => {
      const mockMovies: Movie[] = [];
      mockMovieRepo.findAndCount.mockResolvedValue([mockMovies, 50]);

      await service.findAll({ page: 3, limit: 10 });

      expect(mockMovieRepo.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 20,
        take: 10,
        order: { title: 'ASC' },
      });
    });
  });

  describe('findById', () => {
    it('should return a movie by id', async () => {
      const mockMovie: Movie = {
        id: 'uuid-123',
        title: 'Test Movie',
        genre: 'Action',
        releaseYear: 2020,
        description: 'A test movie',
        posterUrl: 'http://example.com/poster.jpg',
      };
      mockMovieRepo.findOne.mockResolvedValue(mockMovie);

      const result = await service.findById('uuid-123');

      expect(result).toEqual({
        id: 'uuid-123',
        title: 'Test Movie',
        genre: 'Action',
        releaseYear: 2020,
        description: 'A test movie',
        posterUrl: 'http://example.com/poster.jpg',
      });
      expect(mockMovieRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
      });
    });

    it('should throw NotFoundException when movie not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('unknown-id')).rejects.toThrow(
        new NotFoundException(`Movie with id 'unknown-id' not found`),
      );
      expect(mockMovieRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'unknown-id' },
      });
    });
  });

  describe('findReviews', () => {
    const movieId = 'movie-uuid-1';
    const mockMovie: Movie = {
      id: movieId,
      title: 'Test Movie',
      genre: 'Action',
      releaseYear: 2020,
      description: 'A test movie',
      posterUrl: 'http://example.com/poster.jpg',
    };

    it('should return reviews for an existing movie ordered by createdAt DESC', async () => {
      const createdAtDate = new Date('2025-01-01');
      const updatedAtDate = new Date('2025-01-02');
      const mockReviews: Partial<Review>[] = [
        {
          id: 'r1',
          movieId,
          userId: 'u1',
          rating: 5,
          comment: 'Great',
          createdAt: createdAtDate,
          updatedAt: updatedAtDate,
        },
        {
          id: 'r2',
          movieId,
          userId: 'u2',
          rating: 3,
          comment: 'OK',
          createdAt: createdAtDate,
          updatedAt: updatedAtDate,
        },
      ];
      mockMovieRepo.findOne.mockResolvedValue(mockMovie);
      mockReviewRepo.find.mockResolvedValue(mockReviews as Review[]);

      const result = await service.findReviews(movieId);

      expect(result).toEqual([
        {
          id: 'r1',
          movieId,
          userId: 'u1',
          rating: 5,
          comment: 'Great',
          createdAt: createdAtDate,
          updatedAt: updatedAtDate,
        },
        {
          id: 'r2',
          movieId,
          userId: 'u2',
          rating: 3,
          comment: 'OK',
          createdAt: createdAtDate,
          updatedAt: updatedAtDate,
        },
      ]);
      expect(mockMovieRepo.findOne).toHaveBeenCalledWith({ where: { id: movieId } });
      expect(mockReviewRepo.find).toHaveBeenCalledWith({
        where: { movieId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when movie has no reviews', async () => {
      mockMovieRepo.findOne.mockResolvedValue(mockMovie);
      mockReviewRepo.find.mockResolvedValue([]);

      const result = await service.findReviews(movieId);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when movie does not exist', async () => {
      mockMovieRepo.findOne.mockResolvedValue(null);

      await expect(service.findReviews('unknown-id')).rejects.toThrow(
        new NotFoundException(`Movie with id 'unknown-id' not found`),
      );
      expect(mockReviewRepo.find).not.toHaveBeenCalled();
    });
  });
});
