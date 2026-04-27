import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';

import { User } from '@/modules/users/entities/user.entity';

import { AuthService } from './auth.service';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('mock-token');
  });

  describe('register', () => {
    it('should return an accessToken for a new email', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);
      const createdUser = {
        id: 'uuid-1',
        email: 'user@example.com',
        passwordHash: 'hashed-password',
        name: 'Test User',
      };
      mockUserRepo.create.mockReturnValue(createdUser);
      mockUserRepo.save.mockResolvedValue(createdUser);

      const result = await service.register({
        email: 'user@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result).toEqual({ accessToken: 'mock-token' });
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'uuid-1',
        email: 'user@example.com',
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'uuid-existing',
        email: 'user@example.com',
      });

      await expect(
        service.register({
          email: 'user@example.com',
          password: 'password123',
          name: 'Test User',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return an accessToken for correct credentials', async () => {
      const existingUser = {
        id: 'uuid-1',
        email: 'user@example.com',
        passwordHash: 'hashed-password',
      };
      mockUserRepo.findOne.mockResolvedValue(existingUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.login({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result).toEqual({ accessToken: 'mock-token' });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password',
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'uuid-1',
        email: 'user@example.com',
      });
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      const existingUser = {
        id: 'uuid-1',
        email: 'user@example.com',
        passwordHash: 'hashed-password',
      };
      mockUserRepo.findOne.mockResolvedValue(existingUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when email is not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
