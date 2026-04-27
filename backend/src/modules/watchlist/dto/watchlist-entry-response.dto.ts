import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WatchlistEntry } from '@/modules/watchlist/entities/watchlist-entry.entity';
import type { WatchlistStatus } from '@/modules/watchlist/entities/watchlist-entry.entity';
import { MovieResponseDto } from '@/modules/movies/dto/movie-response.dto';

export class WatchlistEntryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  movieId: string;

  @ApiProperty()
  status: WatchlistStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: MovieResponseDto })
  movie?: MovieResponseDto;

  static from(entry: WatchlistEntry): WatchlistEntryResponseDto {
    const dto = new WatchlistEntryResponseDto();
    dto.id = entry.id;
    dto.userId = entry.userId;
    dto.movieId = entry.movieId;
    dto.status = entry.status;
    dto.createdAt = entry.createdAt;
    dto.updatedAt = entry.updatedAt;
    dto.movie = entry.movie ? MovieResponseDto.from(entry.movie) : undefined;
    return dto;
  }
}
