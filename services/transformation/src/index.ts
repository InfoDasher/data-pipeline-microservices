import { app } from './app';

const PORT = process.env.TRANSFORMATION_PORT || 3002;

const server = app.listen(PORT, () => {
  console.log(`Transformation service running on port ${PORT}`);
});

const shutdown = () => {
  console.log('Shutting down transformation service...');
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
