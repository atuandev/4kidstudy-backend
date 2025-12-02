import {
  Controller,
  Get,
  UseGuards,
  Req,
  Param,
  ParseIntPipe,
  Query,
  Put,
  Body,
  Post,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  UserProfileDto,
  UserStatsDto,
  ResetPasswordDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto/index';
import { UpdateUserStatusDto } from './dto/req/update-user-status.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [UserProfileDto],
  })
  async getAllUsers(@Query('isActive') isActive?: boolean) {
    return this.userService.findAll(isActive);
  }

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
    description: 'Unauthorized - not logged in',
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
    description: 'Unauthorized - not logged in',
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
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - not logged in',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserProfileDto> {
    return this.userService.findById(id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user learning statistics' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
    type: UserStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - not logged in',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserStats(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserStatsDto> {
    return this.userService.findProfileStatistics(id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user active status' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'number' })
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiResponse({
    status: 200,
    description: 'User status updated',
    type: UserProfileDto,
  })
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserStatusDto,
  ): Promise<UserProfileDto> {
    return this.userService.updateStatus(id, body.isActive);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset user password',
    description:
      'Reset password for a user after email verification (OTP verified)',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Đặt lại mật khẩu thành công' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Email not verified',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.userService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.newPassword,
    );
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update current user profile',
    description:
      'Update profile information including avatar upload to Cloudinary',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Doe' },
        grade: {
          type: 'string',
          enum: ['GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5'],
        },
        dob: { type: 'string', format: 'date', example: '2015-01-15' },
        gender: { type: 'string', enum: ['MALE', 'FEMALE', 'UNSET'] },
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - not logged in',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateCurrentUserProfile(
    @Req() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<UserProfileDto> {
    return this.userService.updateProfile(
      req.user.id,
      updateProfileDto,
      avatar,
    );
  }

  @Post('me/change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change current user password',
    description: 'Change password for the currently logged-in user',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Đổi mật khẩu thành công' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Invalid current password or new password same as old',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - not logged in',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async changePassword(
    @Req() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(req.user.id, changePasswordDto);
  }
}
