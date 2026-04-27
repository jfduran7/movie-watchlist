import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { UsersService } from '@/modules/users/users.service';
import { User } from '@/modules/users/entities/user.entity';
import { WatchlistEntry } from '@/modules/watchlist/entities/watchlist-entry.entity';
import { Review } from '@/modules/reviews/entities/review.entity';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepo: Partial<Repository<User>>;
  let mockWatchlistRepo: Partial<Repository<WatchlistEntry>>;
  let mockReviewRepo: Partial<Repository<Review>>;

  beforeEach(async () => {
    const mockQueryBuilder: Partial<SelectQueryBuilder<Review>> = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };

    mockUserRepo = {
      findOne: jest.fn(),
    };

    mockWatchlistRepo = {
      count: jest.fn(),
    };

    mockReviewRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(WatchlistEntry),
          useValue: mockWatchlistRepo,
        },
        {
          provide: getRepositoryToken(Review),
          useValue: mockReviewRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('getProfile', () => {
    it('should return user profile with watched count and average rating', async () => {
      const userId = 'user-123';
      const user = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed_password',
        createdAt: new Date(),
      };

      jest
        .spyOn(mockUserRepo, 'findOne')
        .mockResolvedValue(user as unknown as User);
      jest.spyOn(mockWatchlistRepo, 'count').mockResolvedValue(3);
      jest.spyOn(mockReviewRepo, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: '4.5' }),
      } as unknown as SelectQueryBuilder<Review>);

      const result = await service.getProfile(userId);

      expect(result).toEqual({
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        stats: { totalWatched: 3, averageRating: 4.5 },
      });

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockWatchlistRepo.count).toHaveBeenCalledWith({
        where: { userId, status: 'watched' },
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should return null for averageRating when no reviews exist', async () => {
      const userId = 'user-456';
      const user = {
        id: userId,
        name: 'Jane Smith',
        email: 'jane@example.com',
        passwordHash: 'hashed_password',
        createdAt: new Date(),
      };

      jest
        .spyOn(mockUserRepo, 'findOne')
        .mockResolvedValue(user as unknown as User);
      jest.spyOn(mockWatchlistRepo, 'count').mockResolvedValue(2);
      jest.spyOn(mockReviewRepo, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: null }),
      } as unknown as SelectQueryBuilder<Review>);

      const result = await service.getProfile(userId);

      expect(result.stats.averageRating).toBeNull();
    });

    it('should return totalWatched as 0 when no watched entries exist', async () => {
      const userId = 'user-789';
      const user = {
        id: userId,
        name: 'Bob Johnson',
        email: 'bob@example.com',
        passwordHash: 'hashed_password',
        createdAt: new Date(),
      };

      jest
        .spyOn(mockUserRepo, 'findOne')
        .mockResolvedValue(user as unknown as User);
      jest.spyOn(mockWatchlistRepo, 'count').mockResolvedValue(0);
      jest.spyOn(mockReviewRepo, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: null }),
      } as unknown as SelectQueryBuilder<Review>);

      const result = await service.getProfile(userId);

      expect(result.stats.totalWatched).toBe(0);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const userId = 'nonexistent-user';

      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(null);

      await expect(service.getProfile(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should never expose passwordHash in the response', async () => {
      const userId = 'user-1000';
      const user = {
        id: userId,
        name: 'Secret User',
        email: 'secret@example.com',
        passwordHash: 'super_secret_hash',
        createdAt: new Date(),
      };

      jest
        .spyOn(mockUserRepo, 'findOne')
        .mockResolvedValue(user as unknown as User);
      jest.spyOn(mockWatchlistRepo, 'count').mockResolvedValue(1);
      jest.spyOn(mockReviewRepo, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: '3.0' }),
      } as unknown as SelectQueryBuilder<Review>);

      const result = await service.getProfile(userId);

      expect(result).not.toHaveProperty('passwordHash');
      expect(Object.keys(result)).toEqual(['id', 'name', 'email', 'stats']);
    });
  });
});
