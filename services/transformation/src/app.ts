import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import transformRoutes from './routes/transform';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/transform', transformRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'up', service: 'transformation', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

export { app };
