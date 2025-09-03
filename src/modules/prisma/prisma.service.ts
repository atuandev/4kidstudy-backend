import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService handles database connection and lifecycle management
 * Implements OnModuleInit and OnModuleDestroy for proper connection handling
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Initialize database connection when module starts
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * Close database connection when module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
