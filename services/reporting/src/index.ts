import { app } from './app';
import { prisma } from './services/reportService';

const PORT = process.env.REPORTING_PORT || 3003;

const server = app.listen(PORT, () => {
  console.log(`Reporting service running on port ${PORT}`);
});

const shutdown = () => {
  console.log('Shutting down reporting service...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
