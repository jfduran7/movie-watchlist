import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { WatchlistService } from '@/modules/watchlist/watchlist.service';
import { AddToWatchlistDto } from '@/modules/watchlist/dto/add-to-watchlist.dto';
import { UpdateWatchlistDto } from '@/modules/watchlist/dto/update-watchlist.dto';

interface AuthUser {
  id: string;
  email: string;
}

class WatchlistQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

@ApiTags('watchlist')
@ApiBearerAuth()
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a movie to the authenticated user watchlist' })
  @ApiResponse({ status: 201, description: 'Entry created' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  @ApiResponse({ status: 409, description: 'Movie already in watchlist' })
  addToWatchlist(
    @CurrentUser() user: AuthUser,
    @Body() dto: AddToWatchlistDto,
  ) {
    return this.watchlistService.addToWatchlist(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user watchlist (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated watchlist entries' })
  getWatchlist(
    @CurrentUser() user: AuthUser,
    @Query() { page = 1, limit = 10 }: WatchlistQueryDto,
  ) {
    return this.watchlistService.getWatchlist(user.id, page, limit);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update the status of a watchlist entry' })
  @ApiResponse({ status: 200, description: 'Entry updated' })
  @ApiResponse({ status: 404, description: 'Watchlist entry not found' })
  updateEntry(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateWatchlistDto,
  ) {
    return this.watchlistService.updateEntry(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove a movie from the authenticated user watchlist',
  })
  @ApiResponse({ status: 204, description: 'Entry removed' })
  @ApiResponse({ status: 404, description: 'Watchlist entry not found' })
  removeEntry(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.watchlistService.removeEntry(id, user.id);
  }
}
