import app from './app';
import { env } from './config/env';
import { prisma } from './config/db';
import { logger } from './config/logger';

async function main() {
  try {
    // Test DB connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    app.listen(Number(env.PORT), () => {
      logger.info(`🚀 FHI API server running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  logger.info('Graceful shutdown complete');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  logger.info('Graceful shutdown complete');
  process.exit(0);
});
