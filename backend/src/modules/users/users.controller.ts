import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from '@/modules/users/users.service';
import { ProfileResponseDto } from '@/modules/users/dto/profile-response.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('profile')
@ApiBearerAuth()
@Controller('profile')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile and stats' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  getMe(@CurrentUser() user: { id: string; email: string }) {
    return this.usersService.getProfile(user.id);
  }
}
