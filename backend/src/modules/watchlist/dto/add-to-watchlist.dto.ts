import { IsIn, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { WatchlistStatus } from '@/modules/watchlist/entities/watchlist-entry.entity';

export class AddToWatchlistDto {
  @ApiProperty({ example: 'uuid-here' })
  @IsUUID()
  movieId: string;

  @ApiProperty({ enum: ['want', 'watching', 'watched'] })
  @IsIn(['want', 'watching', 'watched'])
  status: WatchlistStatus;
}
