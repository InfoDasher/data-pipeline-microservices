import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import ingestRoutes from './routes/ingest';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/ingest', ingestRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'up', service: 'ingestion', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

export { app };
