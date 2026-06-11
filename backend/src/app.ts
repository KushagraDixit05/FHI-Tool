import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorMiddleware } from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';

const app = express();

// ─── Security Headers (Phase 5 adds helmet) ───────────────────────────
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logging ──────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
// Phase 1+ routes added here as we progress

// ─── Global Error Handler (must be last) ──────────────────────────────
app.use(errorMiddleware);

export default app;
