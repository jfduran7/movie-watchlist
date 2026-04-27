import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Review } from '@/modules/reviews/entities/review.entity';
import { WatchlistEntry } from '@/modules/watchlist/entities/watchlist-entry.entity';
import { ReviewsController } from '@/modules/reviews/reviews.controller';
import { ReviewsService } from '@/modules/reviews/reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([Review, WatchlistEntry])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
