import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorMiddleware } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { apiLimiter, authLimiter } from './middleware/rateLimit.middleware';

// ─── Route Modules ────────────────────────────────────────────────────────────
import authRoutes from './modules/auth/auth.routes';
import buyerRoutes from './modules/buyers/buyer.routes';
import productRoutes from './modules/products/product.routes';
import supplierRoutes from './modules/suppliers/supplier.routes';
import masterRoutes from './modules/master-data/master.routes';
import userRoutes from './modules/users/user.routes';
import costingRoutes from './modules/costing/costing.routes';
import quoteRoutes from './modules/quotes/quote.routes';

const app = express();

// ─── Allowed Origins ──────────────────────────────────────────────────────────
const allowedOriginPatterns = [
  /^http:\/\/localhost:\d+$/,
  /^https:\/\/.*\.vercel\.app$/,
];

const allowedOriginExact = [env.FRONTEND_URL].filter(Boolean) as string[];

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOriginExact.includes(origin)) return callback(null, true);
      if (allowedOriginPatterns.some((re) => re.test(origin))) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Request Logging ──────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes); // Phase 0 — Auth (brute-force throttled)
app.use('/api/buyers', buyerRoutes);    // Phase 1 — Buyers
app.use('/api/products', productRoutes);// Phase 1 — Products
app.use('/api/suppliers', supplierRoutes); // Phase 1 — Suppliers
app.use('/api/master', masterRoutes);   // Phase 1 — Master Data
app.use('/api/users', userRoutes);      // Phase 1 — User Management (Admin)
app.use('/api/costing', costingRoutes); // Phase 2 — Costing Engine
app.use('/api/quotes', quoteRoutes);    // Phase 2 — Quotes

// ─── 404 for unmatched routes ─────────────────────────────────────────────────
app.use(notFoundHandler);

// ─── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorMiddleware);

export default app;
