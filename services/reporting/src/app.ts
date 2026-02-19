import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import reportRoutes from './routes/reports';
import authRoutes from './routes/auth';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Auth routes (public — no JWT required)
app.use('/api/auth', authRoutes);

// JWT auth middleware for report routes
app.use('/api/reports', authMiddleware);

// Routes
app.use('/api/reports', reportRoutes);

// Health check (simple, for Docker/load balancer)
app.get('/health', (_req, res) => {
  res.json({ status: 'up', service: 'reporting', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

export { app };
