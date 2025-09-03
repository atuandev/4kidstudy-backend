import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@prisma/client';

/**
 * UsersController handles HTTP requests for user operations
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create a new user
   */
  @Post()
  async createUser(
    @Body() createUserDto: { email: string; name?: string },
  ): Promise<User> {
    return this.usersService.createUser(createUserDto);
  }

  /**
   * Get all users
   */
  @Get()
  async getAllUsers(): Promise<User[]> {
    return this.usersService.getAllUsers();
  }

  /**
   * Get a user by email
   */
  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string): Promise<User | null> {
    return this.usersService.findUserByEmail(email);
  }

  /**
   * Update a user by id
   */
  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: { name?: string },
  ): Promise<User> {
    return this.usersService.updateUser(id, updateUserDto);
  }

  /**
   * Delete a user by id
   */
  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<User> {
    return this.usersService.deleteUser(id);
  }
}
