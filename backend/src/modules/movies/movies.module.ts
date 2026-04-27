import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '@/modules/movies/entities/movie.entity';
import { Review } from '@/modules/reviews/entities/review.entity';
import { MoviesController } from '@/modules/movies/movies.controller';
import { MoviesService } from '@/modules/movies/movies.service';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, Review])],
  controllers: [MoviesController],
  providers: [MoviesService],
  exports: [MoviesService],
})
export class MoviesModule {}
