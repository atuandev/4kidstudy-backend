import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

/**
 * UsersService handles user-related business logic
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new user
   */
  async createUser(data: { email: string; name?: string }): Promise<User> {
    return await this.prisma.user.create({
      data,
    });
  }

  /**
   * Find a user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    return await this.prisma.user.findMany();
  }

  /**
   * Update a user by id
   */
  async updateUser(id: string, data: { name?: string }): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a user by id
   */
  async deleteUser(id: string): Promise<User> {
    return await this.prisma.user.delete({
      where: { id },
    });
  }
}
