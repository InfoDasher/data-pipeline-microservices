import { app } from './app';
import { prisma } from './services/ingestService';

const PORT = process.env.INGESTION_PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Ingestion service running on port ${PORT}`);
});

const shutdown = () => {
  console.log('Shutting down ingestion service...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
