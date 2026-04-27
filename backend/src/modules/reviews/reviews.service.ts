import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Review } from '@/modules/reviews/entities/review.entity';
import { WatchlistEntry } from '@/modules/watchlist/entities/watchlist-entry.entity';
import { CreateReviewDto } from '@/modules/reviews/dto/create-review.dto';
import { UpdateReviewDto } from '@/modules/reviews/dto/update-review.dto';
import { ReviewResponseDto } from '@/modules/reviews/dto/review-response.dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(WatchlistEntry)
    private readonly watchlistRepo: Repository<WatchlistEntry>,
  ) {}

  async create(userId: string, dto: CreateReviewDto): Promise<ReviewResponseDto> {
    const watchlistEntry = await this.watchlistRepo.findOne({
      where: { userId, movieId: dto.movieId, status: 'watched' },
    });
    if (!watchlistEntry) {
      throw new ForbiddenException(
        'You must mark this movie as watched before reviewing it',
      );
    }

    const existingReview = await this.reviewRepo.findOne({
      where: { userId, movieId: dto.movieId },
    });
    if (existingReview) {
      throw new ConflictException('You have already reviewed this movie');
    }

    const review = this.reviewRepo.create({ userId, ...dto });
    const saved = await this.reviewRepo.save(review);
    this.logger.log(
      `Review created by user ${userId} for movie ${dto.movieId}`,
    );
    return ReviewResponseDto.from(saved);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewRepo.findOne({ where: { id, userId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    Object.assign(review, dto);
    const saved = await this.reviewRepo.save(review);
    this.logger.log(`Review ${id} updated by user ${userId}`);
    return ReviewResponseDto.from(saved);
  }

  async remove(id: string, userId: string): Promise<void> {
    const review = await this.reviewRepo.findOne({ where: { id, userId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.reviewRepo.remove(review);
    this.logger.log(`Review ${id} removed by user ${userId}`);
  }
}
