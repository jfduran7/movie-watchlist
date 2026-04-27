import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Movie } from '@/modules/movies/entities/movie.entity';
import { WatchlistEntry } from '@/modules/watchlist/entities/watchlist-entry.entity';
import { WatchlistController } from '@/modules/watchlist/watchlist.controller';
import { WatchlistService } from '@/modules/watchlist/watchlist.service';

@Module({
  imports: [TypeOrmModule.forFeature([WatchlistEntry, Movie])],
  controllers: [WatchlistController],
  providers: [WatchlistService],
})
export class WatchlistModule {}
