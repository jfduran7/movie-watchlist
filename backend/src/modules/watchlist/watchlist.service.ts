import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Movie } from '@/modules/movies/entities/movie.entity';
import { WatchlistEntry } from '@/modules/watchlist/entities/watchlist-entry.entity';
import { AddToWatchlistDto } from '@/modules/watchlist/dto/add-to-watchlist.dto';
import { UpdateWatchlistDto } from '@/modules/watchlist/dto/update-watchlist.dto';
import { WatchlistEntryResponseDto } from '@/modules/watchlist/dto/watchlist-entry-response.dto';
import { PaginatedResult } from '@/common/types/paginated-result.type';

@Injectable()
export class WatchlistService {
  private readonly logger = new Logger(WatchlistService.name);

  constructor(
    @InjectRepository(WatchlistEntry)
    private readonly entryRepo: Repository<WatchlistEntry>,
    @InjectRepository(Movie)
    private readonly movieRepo: Repository<Movie>,
  ) {}

  async addToWatchlist(
    userId: string,
    dto: AddToWatchlistDto,
  ): Promise<WatchlistEntryResponseDto> {
    const movie = await this.movieRepo.findOne({ where: { id: dto.movieId } });
    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    const existing = await this.entryRepo.findOne({
      where: { userId, movieId: dto.movieId },
    });
    if (existing) {
      throw new ConflictException('Movie already in watchlist');
    }

    const entry = this.entryRepo.create({
      userId,
      movieId: dto.movieId,
      status: dto.status,
    });
    const saved = await this.entryRepo.save(entry);
    this.logger.log(`User ${userId} added movie ${dto.movieId} to watchlist`);
    return WatchlistEntryResponseDto.from(saved);
  }

  async getWatchlist(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<WatchlistEntryResponseDto>> {
    const [data, total] = await this.entryRepo.findAndCount({
      where: { userId },
      relations: ['movie'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      data: data.map(WatchlistEntryResponseDto.from),
      meta: { total, page, limit },
    };
  }

  async updateEntry(
    id: string,
    userId: string,
    dto: UpdateWatchlistDto,
  ): Promise<WatchlistEntryResponseDto> {
    const entry = await this.entryRepo.findOne({ where: { id, userId } });
    if (!entry) {
      throw new NotFoundException('Watchlist entry not found');
    }

    entry.status = dto.status;
    const updated = await this.entryRepo.save(entry);
    this.logger.log(
      `User ${userId} updated watchlist entry ${id} to status ${dto.status}`,
    );
    return WatchlistEntryResponseDto.from(updated);
  }

  async removeEntry(id: string, userId: string): Promise<void> {
    const entry = await this.entryRepo.findOne({ where: { id, userId } });
    if (!entry) {
      throw new NotFoundException('Watchlist entry not found');
    }

    await this.entryRepo.remove(entry);
    this.logger.log(`User ${userId} removed watchlist entry ${id}`);
  }
}
