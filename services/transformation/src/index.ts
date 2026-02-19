import { app } from './app';
import { prisma } from './services/transformService';

const PORT = process.env.TRANSFORMATION_PORT || 3002;

const server = app.listen(PORT, () => {
  console.log(`Transformation service running on port ${PORT}`);
});

const shutdown = () => {
  console.log('Shutting down transformation service...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
