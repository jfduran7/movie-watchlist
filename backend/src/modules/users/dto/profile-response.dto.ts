import { ApiProperty } from '@nestjs/swagger';

export class ProfileStatsDto {
  @ApiProperty()
  totalWatched: number;

  @ApiProperty({ nullable: true })
  averageRating: number | null;
}

export class ProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ type: ProfileStatsDto })
  stats: ProfileStatsDto;
}
