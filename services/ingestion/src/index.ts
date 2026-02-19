import { app } from './app';

const PORT = process.env.INGESTION_PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Ingestion service running on port ${PORT}`);
});

const shutdown = () => {
  console.log('Shutting down ingestion service...');
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
