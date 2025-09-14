import { Controller, Get, UseGuards, Req, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserProfileDto,UserStatsDto } from './dto/index';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - not logged in' 
  })
  async getCurrentUser(@Req() req: any): Promise<UserProfileDto> {
    return this.userService.findById(req.user.id);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user learning statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'User statistics retrieved successfully',
    type: UserStatsDto,
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - not logged in' 
  })
  async getCurrentUserStats(@Req() req: any): Promise<UserStatsDto> {
    return this.userService.findProfileStatistics(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ 
    name: 'id', 
    description: 'User ID',
    type: 'number'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - not logged in' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  async getUserById(@Param('id', ParseIntPipe) id: number): Promise<UserProfileDto> {
    return this.userService.findById(id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user learning statistics' })
  @ApiParam({ 
    name: 'id', 
    description: 'User ID',
    type: 'number'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User statistics retrieved successfully',
    type: UserStatsDto,
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - not logged in' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  async getUserStats(@Param('id', ParseIntPipe) id: number): Promise<UserStatsDto> {
    return this.userService.findProfileStatistics(id);
  }
}
