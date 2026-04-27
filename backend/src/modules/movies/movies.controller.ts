import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MoviesService } from '@/modules/movies/movies.service';
import { ListMoviesDto } from '@/modules/movies/dto/list-movies.dto';
import { MovieResponseDto } from '@/modules/movies/dto/movie-response.dto';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('movies')
@ApiBearerAuth()
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @ApiOperation({
    summary: 'List movies with optional genre filter and pagination',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of movies', type: [MovieResponseDto] })
  findAll(@Query() dto: ListMoviesDto) {
    return this.moviesService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a movie by ID' })
  @ApiResponse({ status: 200, description: 'Movie found', type: MovieResponseDto })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  findById(@Param('id') id: string) {
    return this.moviesService.findById(id);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get all reviews for a movie' })
  @ApiResponse({ status: 200, description: 'List of reviews for the movie' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  findReviews(@Param('id') id: string) {
    return this.moviesService.findReviews(id);
  }
}
