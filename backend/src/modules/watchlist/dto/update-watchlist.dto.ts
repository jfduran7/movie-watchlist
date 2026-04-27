import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { WatchlistStatus } from '@/modules/watchlist/entities/watchlist-entry.entity';

export class UpdateWatchlistDto {
  @ApiProperty({ enum: ['want', 'watching', 'watched'] })
  @IsIn(['want', 'watching', 'watched'])
  status: WatchlistStatus;
}
