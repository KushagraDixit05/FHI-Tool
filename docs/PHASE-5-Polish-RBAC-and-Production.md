# PHASE 5 — Polish, RBAC, Security & Production Launch
**FHI Export Trade Calculator**
**Duration: 5–7 days**
**Goal: Production-ready platform — secure, polished, and deployable**

---

## 5.1 Overview

Phase 5 is not about new features. It's about making everything already built *production-grade*. This includes:
- Full Role-Based Access Control (RBAC)
- Security hardening
- Performance optimization
- Error handling and logging
- Final UI polish
- Production deployment with monitoring
- Data backup strategy

---

## 5.2 Role-Based Access Control (RBAC)

### Role Definitions

| Role | What They Can Do |
|---|---|
| **ADMIN** | Everything — users, settings, all data, all documents |
| **TRADE_MANAGER** | Create/edit quotes, buyers, products, view analytics, internal docs |
| **SALES** | Create/edit quotes, view buyers, generate buyer-facing docs only |
| **FINANCE** | View all quotes (read-only), access margin + costing reports |
| **OPERATIONS** | View quotes in Shipment Planned/Closed status, packing docs |

### Backend RBAC Middleware

`backend/src/middleware/role.middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';

type Role = 'ADMIN' | 'TRADE_MANAGER' | 'SALES' | 'FINANCE' | 'OPERATIONS';

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `This action requires one of: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}
```

Apply to routes:

```typescript
// Only Admin can manage users
router.get('/users', requireRole('ADMIN'), userController.list);
router.post('/users', requireRole('ADMIN'), userController.create);

// Finance + Admin can see margin analysis
router.get('/documents/quote/:id/margin-analysis', requireRole('ADMIN', 'FINANCE'), docController.marginAnalysis);

// Sales can create quotes
router.post('/quotes', requireRole('ADMIN', 'TRADE_MANAGER', 'SALES'), quoteController.create);

// Operations can only read
router.get('/quotes', requireRole('ADMIN', 'TRADE_MANAGER', 'SALES', 'FINANCE', 'OPERATIONS'), quoteController.list);
```

### Frontend RBAC

`hooks/usePermissions.ts`:

```typescript
const PERMISSIONS = {
  canCreateQuote: ['ADMIN', 'TRADE_MANAGER', 'SALES'],
  canViewInternalDocs: ['ADMIN', 'TRADE_MANAGER', 'FINANCE'],
  canViewMarginAnalysis: ['ADMIN', 'FINANCE'],
  canManageUsers: ['ADMIN'],
  canEditMasterData: ['ADMIN', 'TRADE_MANAGER'],
  canViewAnalytics: ['ADMIN', 'TRADE_MANAGER', 'FINANCE'],
  canMarkShipment: ['ADMIN', 'TRADE_MANAGER', 'OPERATIONS'],
};

export function usePermissions() {
  const { user } = useAuthStore();

  return {
    can: (permission: keyof typeof PERMISSIONS) =>
      PERMISSIONS[permission].includes(user?.role ?? ''),
  };
}
```

Use in components:
```typescript
const { can } = usePermissions();

// Conditionally show
{can('canCreateQuote') && <Button onClick={...}>New Quote</Button>}
{can('canViewInternalDocs') && <DocumentCard type="internal-costing" />}
```

---

## 5.3 User Management (Admin Panel)

`app/settings/users/page.tsx` — Admin-only:

### Features
- List all users with name, email, role, status, last login
- Invite new user (send email with temp password or invite link)
- Change user role
- Activate / deactivate user
- Reset password

### API

```
GET    /api/users               (Admin only)
POST   /api/users               (Admin — create user)
PUT    /api/users/:id/role      (Admin — change role)
PATCH  /api/users/:id/toggle    (Admin — activate/deactivate)
POST   /api/users/:id/reset-password (Admin)
```

---

## 5.4 Security Hardening

### Backend

```bash
npm install helmet express-rate-limit
```

`app.ts` additions:
```typescript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,                   // limit per IP
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Stricter limit on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts'
});
app.use('/api/auth/', authLimiter);
```

### Input Sanitization

```bash
npm install dompurify jsdom
```

Sanitize any user-generated content that ends up in PDF templates:
```typescript
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window as unknown as Window);

function sanitize(input: string): string {
  return purify.sanitize(input);
}
```

### Environment Variable Validation

`backend/src/config/env.ts`:
```typescript
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
// This throws at startup if any required env var is missing
```

---

## 5.5 Error Handling

### Global Error Handler

`backend/src/middleware/error.middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      issues: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Record already exists (unique constraint)' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' });
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired — please log in again' });
  }

  // Unknown errors
  console.error('Unhandled error:', err);
  return res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' ? { message: err.message } : {}),
  });
}
```

### Frontend Error Handling

Axios interceptor in `frontend/lib/api.ts`:

```typescript
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 5.6 Logging

Use `winston` for structured backend logging:

```bash
npm install winston
```

```typescript
// src/config/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    // In production, also log to file or external service
  ],
});
```

Log key events:
- Every API request (method, path, status, duration)
- Auth events (login, logout, failed attempts)
- Quote creation and status changes
- PDF generation
- Errors

---

## 5.7 Performance Optimizations

### Backend
- Add database indexes on frequently queried fields:
```prisma
model Quote {
  @@index([buyerId])
  @@index([status])
  @@index([createdById])
  @@index([createdAt])
}

model Product {
  @@index([productCode])
}
```

- Paginate all list endpoints (never return unbounded arrays):
```typescript
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 20;
const skip = (page - 1) * limit;

const [data, total] = await Promise.all([
  prisma.quote.findMany({ skip, take: limit, ...where }),
  prisma.quote.count({ ...where }),
]);

return { data, total, page, totalPages: Math.ceil(total / limit) };
```

### Frontend
- Use Next.js `loading.tsx` files for route-level loading states
- Lazy-load heavy chart components: `const LineChart = dynamic(() => import(...), { ssr: false })`
- Cache master data (product lines, currencies) in Zustand — fetch once per session
- Use `SWR` or `React Query` for auto-revalidation on quote list

---

## 5.8 Final UI Polish

### Items to polish before launch:

**Empty States**
Every list page needs a proper empty state:
```typescript
// components/ui/EmptyState.tsx
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-muted-foreground mb-4">{icon}</div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-muted-foreground text-sm mt-1 mb-4">{description}</p>
      {action}
    </div>
  );
}
```

**Toast Notifications**
Use shadcn/ui `Sonner` or `Toast` for all success/error feedback:
```typescript
import { toast } from 'sonner';
// On success:
toast.success('Quote created successfully');
// On error:
toast.error('Failed to save quote. Please try again.');
```

**Confirm Dialogs**
Destructive actions (delete, status to LOST) must have confirmation:
```typescript
// components/ui/ConfirmDialog.tsx
// Wraps shadcn AlertDialog with title, description, confirm button
```

**Loading Skeletons**
Replace bare spinners with content-shaped skeletons on key pages (quote list, dashboard).

**Mobile Responsiveness**
Check and fix layout on 375px (iPhone SE) and 768px (tablet):
- Sidebar collapses to bottom nav on mobile
- Tables become scrollable horizontally
- Quote builder steps stack vertically

---

## 5.9 Production Deployment Checklist

### Vercel (Frontend)

- [ ] Production environment variables set (`NEXT_PUBLIC_API_URL` pointing to Railway production URL)
- [ ] Custom domain connected (if applicable)
- [ ] `next.config.js` has correct image domains
- [ ] Build succeeds: `npm run build` with no errors
- [ ] Vercel Analytics enabled

### Railway (Backend)

- [ ] All env vars set in Railway dashboard (not .env file)
- [ ] `DATABASE_URL` pointing to production PostgreSQL
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` is a strong random string (32+ chars)
- [ ] `FRONTEND_URL` set to Vercel domain (for CORS)
- [ ] Health check endpoint `/health` responding

### Database

- [ ] Production database migrated: `npx prisma migrate deploy`
- [ ] Seed data loaded (product lines, incoterms, ports, initial currency rates)
- [ ] Daily automated backups configured (Railway provides this)
- [ ] Connection pooling enabled (Railway PostgreSQL does this automatically)

### Security

- [ ] No `.env` files committed to git
- [ ] `console.log` debugging removed from production code
- [ ] Error messages don't expose stack traces in production
- [ ] All API routes protected by auth middleware
- [ ] Admin-only routes protected by role middleware
- [ ] Rate limiting active
- [ ] Helmet headers active

---

## 5.10 Post-Launch Monitoring

### Uptime Monitoring
Use **UptimeRobot** (free) to ping `/health` every 5 minutes. Alert via email if down.

### Error Tracking
Use **Sentry** (free tier):
```bash
npm install @sentry/node @sentry/nextjs
```

This catches runtime errors in production and sends email alerts with full stack trace.

### Database Monitoring
Railway dashboard shows query count, CPU, and memory. Set alerts for high usage.

---

## 5.11 Phase 5 Completion Checklist

### Security & RBAC
- [ ] All 5 roles defined and enforced on backend routes
- [ ] Frontend hides/shows UI elements based on role
- [ ] Helmet and rate limiting active
- [ ] Input sanitization for PDF-rendered content
- [ ] Env var validation at startup
- [ ] Global error handler covering Zod, Prisma, JWT errors

### User Management
- [ ] Admin can create, update role, deactivate users
- [ ] Users page in settings (Admin only)

### Performance
- [ ] Database indexes added on key fields
- [ ] All list endpoints paginated
- [ ] Master data cached in Zustand
- [ ] Heavy components lazy-loaded

### UI Polish
- [ ] Empty states on all list pages
- [ ] Toast notifications on all actions
- [ ] Confirm dialogs on destructive actions
- [ ] Loading skeletons on key pages
- [ ] Mobile layout works on 375px+

### Deployment
- [ ] Production Vercel deployment live
- [ ] Production Railway deployment live
- [ ] Production database migrated and seeded
- [ ] Health check responding
- [ ] UptimeRobot monitoring active
- [ ] Sentry error tracking active
- [ ] No sensitive data in git history

---

## 5.12 Claude Code Prompts for This Phase

**For RBAC Middleware:**
> "Build a TypeScript Express middleware called requireRole that accepts a list of allowed Role enums and returns a 403 if the authenticated user's role isn't in the list. The user is attached to req.user by the auth middleware. Roles are: ADMIN, TRADE_MANAGER, SALES, FINANCE, OPERATIONS."

**For Global Error Handler:**
> "Write a global Express error handling middleware in TypeScript that handles: Zod validation errors (return 400 with field-level messages), Prisma P2002 (409 conflict) and P2025 (404 not found), JWT errors (401), and unknown errors (500, hide stack trace in production). Use this pattern: [paste]"

**For Frontend Permissions Hook:**
> "Write a React hook called usePermissions that reads the current user's role from Zustand auth store and returns a can(permissionKey) function. The permissions map is: [paste]. Usage: const { can } = usePermissions(); then can('canCreateQuote') returns boolean."
