import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { ReviewsService } from './reviews.service';
import { Review } from '@/modules/reviews/entities/review.entity';
import { WatchlistEntry } from '@/modules/watchlist/entities/watchlist-entry.entity';

describe('ReviewsService', () => {
  let service: ReviewsService;
  const mockReviewRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const mockWatchlistRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useValue: mockReviewRepo },
        {
          provide: getRepositoryToken(WatchlistEntry),
          useValue: mockWatchlistRepo,
        },
      ],
    }).compile();
    service = module.get<ReviewsService>(ReviewsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userId = 'user-uuid-1';
    const movieId = 'movie-uuid-1';
    const dto = { movieId, rating: 4, comment: 'Great film' };

    it('should create and return a review when movie is watched and no prior review exists', async () => {
      const watchlistEntry: Partial<WatchlistEntry> = {
        id: 'entry-uuid-1',
        userId,
        movieId,
        status: 'watched',
      };
      const now = new Date();
      const createdReview: Partial<Review> = {
        id: 'review-uuid-1',
        userId,
        movieId,
        rating: dto.rating,
        comment: dto.comment,
        createdAt: now,
        updatedAt: now,
      };
      mockWatchlistRepo.findOne.mockResolvedValue(watchlistEntry);
      mockReviewRepo.findOne.mockResolvedValue(null);
      mockReviewRepo.create.mockReturnValue(createdReview);
      mockReviewRepo.save.mockResolvedValue(createdReview);

      const result = await service.create(userId, dto);

      expect(result).toEqual({
        id: 'review-uuid-1',
        userId,
        movieId,
        rating: dto.rating,
        comment: dto.comment,
        createdAt: now,
        updatedAt: now,
      });
      expect(mockWatchlistRepo.findOne).toHaveBeenCalledWith({
        where: { userId, movieId, status: 'watched' },
      });
      expect(mockReviewRepo.findOne).toHaveBeenCalledWith({
        where: { userId, movieId },
      });
      expect(mockReviewRepo.create).toHaveBeenCalledWith({ userId, ...dto });
      expect(mockReviewRepo.save).toHaveBeenCalledWith(createdReview);
    });

    it('should throw ForbiddenException when movie has want or watching status (watchlistRepo returns null)', async () => {
      mockWatchlistRepo.findOne.mockResolvedValue(null);

      await expect(service.create(userId, dto)).rejects.toThrow(
        new ForbiddenException(
          'You must mark this movie as watched before reviewing it',
        ),
      );
      expect(mockWatchlistRepo.findOne).toHaveBeenCalledWith({
        where: { userId, movieId, status: 'watched' },
      });
      expect(mockReviewRepo.findOne).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when movie is not in watchlist at all (watchlistRepo returns null)', async () => {
      mockWatchlistRepo.findOne.mockResolvedValue(null);

      await expect(service.create(userId, dto)).rejects.toThrow(
        new ForbiddenException(
          'You must mark this movie as watched before reviewing it',
        ),
      );
    });

    it('should throw ConflictException when movie is watched but review already exists', async () => {
      const watchlistEntry: Partial<WatchlistEntry> = {
        id: 'entry-uuid-1',
        userId,
        movieId,
        status: 'watched',
      };
      const existingReview: Partial<Review> = {
        id: 'review-uuid-existing',
        userId,
        movieId,
        rating: 3,
      };
      mockWatchlistRepo.findOne.mockResolvedValue(watchlistEntry);
      mockReviewRepo.findOne.mockResolvedValue(existingReview);

      await expect(service.create(userId, dto)).rejects.toThrow(
        new ConflictException('You have already reviewed this movie'),
      );
      expect(mockReviewRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const userId = 'user-uuid-1';
    const reviewId = 'review-uuid-1';
    const dto = { rating: 5, comment: 'Updated comment' };

    it('should update and return the review when it belongs to the user', async () => {
      const now = new Date();
      const existingReview: Partial<Review> = {
        id: reviewId,
        userId,
        movieId: 'movie-uuid-1',
        rating: 3,
        comment: 'Original comment',
        createdAt: now,
        updatedAt: now,
      };
      const updatedReview = { ...existingReview, ...dto };
      mockReviewRepo.findOne.mockResolvedValue(existingReview);
      mockReviewRepo.save.mockResolvedValue(updatedReview);

      const result = await service.update(reviewId, userId, dto);

      expect(result).toEqual({
        id: reviewId,
        userId,
        movieId: 'movie-uuid-1',
        rating: dto.rating,
        comment: dto.comment,
        createdAt: now,
        updatedAt: now,
      });
      expect(mockReviewRepo.findOne).toHaveBeenCalledWith({
        where: { id: reviewId, userId },
      });
      expect(mockReviewRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when review is not found or belongs to another user', async () => {
      mockReviewRepo.findOne.mockResolvedValue(null);

      await expect(service.update(reviewId, userId, dto)).rejects.toThrow(
        new NotFoundException('Review not found'),
      );
      expect(mockReviewRepo.findOne).toHaveBeenCalledWith({
        where: { id: reviewId, userId },
      });
      expect(mockReviewRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const userId = 'user-uuid-1';
    const reviewId = 'review-uuid-1';

    it('should remove the review when it belongs to the user', async () => {
      const existingReview: Partial<Review> = {
        id: reviewId,
        userId,
        movieId: 'movie-uuid-1',
        rating: 4,
      };
      mockReviewRepo.findOne.mockResolvedValue(existingReview);
      mockReviewRepo.remove.mockResolvedValue(undefined);

      await expect(service.remove(reviewId, userId)).resolves.toBeUndefined();
      expect(mockReviewRepo.findOne).toHaveBeenCalledWith({
        where: { id: reviewId, userId },
      });
      expect(mockReviewRepo.remove).toHaveBeenCalledWith(existingReview);
    });

    it('should throw NotFoundException when review is not found or belongs to another user', async () => {
      mockReviewRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(reviewId, userId)).rejects.toThrow(
        new NotFoundException('Review not found'),
      );
      expect(mockReviewRepo.findOne).toHaveBeenCalledWith({
        where: { id: reviewId, userId },
      });
      expect(mockReviewRepo.remove).not.toHaveBeenCalled();
    });
  });
});
