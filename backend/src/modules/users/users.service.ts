import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { WatchlistEntry } from '@/modules/watchlist/entities/watchlist-entry.entity';
import { Review } from '@/modules/reviews/entities/review.entity';
import { ProfileResponseDto } from '@/modules/users/dto/profile-response.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(WatchlistEntry)
    private readonly watchlistRepository: Repository<WatchlistEntry>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalWatched = await this.watchlistRepository.count({
      where: { userId, status: 'watched' },
    });

    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.userId = :userId', { userId })
      .getRawOne<{ avg: string | null }>();

    const averageRating = result?.avg != null ? parseFloat(result.avg) : null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      stats: { totalWatched, averageRating },
    };
  }
}
