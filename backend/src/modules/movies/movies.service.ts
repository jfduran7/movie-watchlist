import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Movie } from '@/modules/movies/entities/movie.entity';
import { Review } from '@/modules/reviews/entities/review.entity';
import { ListMoviesDto } from '@/modules/movies/dto/list-movies.dto';
import { MovieResponseDto } from '@/modules/movies/dto/movie-response.dto';
import { ReviewResponseDto } from '@/modules/reviews/dto/review-response.dto';
import { PaginatedResult } from '@/common/types/paginated-result.type';

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);

  constructor(
    @InjectRepository(Movie) private readonly movieRepo: Repository<Movie>,
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
  ) {}

  async findAll(dto: ListMoviesDto): Promise<PaginatedResult<MovieResponseDto>> {
    const { genre, page = 1, limit = 10 } = dto;
    const where = genre ? { genre: ILike(`%${genre}%`) } : {};
    const [data, total] = await this.movieRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { title: 'ASC' },
    });
    return { data: data.map(MovieResponseDto.from), meta: { total, page, limit } };
  }

  async findById(id: string): Promise<MovieResponseDto> {
    const movie = await this.movieRepo.findOne({ where: { id } });
    if (!movie) throw new NotFoundException(`Movie with id '${id}' not found`);
    return MovieResponseDto.from(movie);
  }

  async findReviews(movieId: string): Promise<ReviewResponseDto[]> {
    await this.findById(movieId);
    const reviews = await this.reviewRepo.find({
      where: { movieId },
      order: { createdAt: 'DESC' },
    });
    return reviews.map(ReviewResponseDto.from);
  }
}
