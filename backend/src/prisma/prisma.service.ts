import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    super({
      datasources: dbUrl
        ? {
            db: {
              url: dbUrl,
            },
          }
        : undefined,
    });

    if (!dbUrl) {
      this.logger.error('CRITICAL: process.env.DATABASE_URL is not defined!');
    } else {
      const masked = dbUrl.replace(/:([^:@]+)@/, ':****@');
      this.logger.log(`Connecting to database at: ${masked}`);
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully.');
    } catch (err: any) {
      this.logger.error(`Database connection failed: ${err.message}`);
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
