import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Movie } from '@/modules/movies/entities/movie.entity';

export class MovieResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  genre: string;

  @ApiProperty()
  releaseYear: number;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  posterUrl: string | null;

  static from(movie: Movie): MovieResponseDto {
    const dto = new MovieResponseDto();
    dto.id = movie.id;
    dto.title = movie.title;
    dto.genre = movie.genre;
    dto.releaseYear = movie.releaseYear;
    dto.description = movie.description;
    dto.posterUrl = movie.posterUrl;
    return dto;
  }
}
