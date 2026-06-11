# PHASE 0 — Project Setup & Architecture
**FHI Export Trade Calculator**
**Duration: 3–5 days**
**Goal: Working monorepo skeleton with auth, DB, and CI/CD ready**

---

## 0.1 Overview

Before writing any feature code, get the full project skeleton in place. This phase produces:
- A working Next.js frontend (App Router)
- A working Node + Express backend
- Database connected with ORM
- Auth system wired up
- Deployed to staging (Vercel + Railway/Render)
- Folder structure that scales to all phases

Everything in later phases plugs into this skeleton. Doing this right saves weeks of refactoring.

---

## 0.2 Tech Stack Decisions

### Frontend
| Tool | Choice | Reason |
|---|---|---|
| Framework | Next.js 14+ (App Router) | SSR, file-based routing, API routes if needed |
| Styling | Tailwind CSS | Fast, utility-first, Claude Code friendly |
| UI Components | shadcn/ui | Accessible, copy-paste, no lock-in |
| State Management | Zustand | Lightweight, simple, good for forms |
| Forms | React Hook Form + Zod | Validation + type safety |
| HTTP Client | Axios | Cleaner than fetch for API calls |
| PDF Generation | react-pdf or puppeteer (backend) | For quotation PDFs |

### Backend
| Tool | Choice | Reason |
|---|---|---|
| Runtime | Node.js 20+ | LTS, stable |
| Framework | Express.js | Familiar, flexible |
| ORM | **Prisma (recommended)** or Drizzle ORM | Type-safe, great DX with Claude Code |
| Database | **PostgreSQL** (recommended) or MongoDB | Relational data fits export costing perfectly |
| Auth | JWT + bcrypt | Simple, stateless, works solo |
| Validation | Zod (shared with frontend) | Single schema source of truth |
| PDF | Puppeteer or @pdf-lib | Server-side PDF generation |
| File Storage | Cloudinary or AWS S3 | For product images, attachments |

> **Note on DB choice:** PostgreSQL + Prisma is strongly recommended. Export costing has deeply relational data (products → costs → quotes → buyers). Prisma's schema file is also excellent for Claude Code to reason about.

### Deployment
| Layer | Service |
|---|---|
| Frontend | Vercel |
| Backend | Railway or Render |
| Database | Railway PostgreSQL or Supabase |
| File Storage | Cloudinary (free tier sufficient for MVP) |

---

## 0.3 Monorepo Folder Structure

```
fhi-platform/
├── frontend/                        # Next.js App
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── quotes/
│   │   │   │   ├── page.tsx          # Quote list
│   │   │   │   ├── new/page.tsx      # Create quote
│   │   │   │   └── [id]/page.tsx     # Quote detail
│   │   │   ├── buyers/
│   │   │   ├── products/
│   │   │   ├── costing/
│   │   │   └── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                       # shadcn components
│   │   ├── layout/                   # Sidebar, Navbar, etc.
│   │   ├── forms/                    # Reusable form components
│   │   ├── quotes/                   # Quote-specific components
│   │   ├── products/                 # Product-specific components
│   │   └── costing/                  # Costing engine components
│   ├── lib/
│   │   ├── api.ts                    # Axios instance + interceptors
│   │   ├── auth.ts                   # Auth helpers
│   │   └── utils.ts
│   ├── hooks/                        # Custom React hooks
│   ├── store/                        # Zustand stores
│   ├── types/                        # Shared TypeScript types
│   ├── constants/                    # Dropdowns, enums, etc.
│   └── public/
│
├── backend/                          # Express API
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts                 # DB connection
│   │   │   └── env.ts                # Environment validation
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # JWT verification
│   │   │   ├── error.middleware.ts   # Global error handler
│   │   │   ├── validate.middleware.ts# Zod validation
│   │   │   └── role.middleware.ts    # RBAC
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── auth.service.ts
│   │   │   ├── buyers/
│   │   │   ├── products/
│   │   │   ├── quotes/
│   │   │   ├── costing/
│   │   │   ├── documents/
│   │   │   └── users/
│   │   ├── shared/
│   │   │   ├── schemas/              # Zod schemas
│   │   │   └── types/
│   │   └── app.ts                    # Express app setup
│   ├── prisma/
│   │   ├── schema.prisma             # Full DB schema
│   │   └── seed.ts                   # Seed data
│   └── index.ts                      # Entry point
│
├── shared/                           # Shared between FE + BE
│   ├── types/
│   │   ├── quote.types.ts
│   │   ├── product.types.ts
│   │   └── costing.types.ts
│   └── constants/
│       ├── incoterms.ts
│       ├── currencies.ts
│       └── categories.ts
│
├── .env.example
├── package.json                      # Root workspace config
└── README.md
```

---

## 0.4 Step-by-Step Setup Tasks

### Step 1: Initialize the Monorepo

```bash
mkdir fhi-platform && cd fhi-platform
npm init -y
# Set up workspaces in root package.json
```

Root `package.json`:
```json
{
  "name": "fhi-platform",
  "private": true,
  "workspaces": ["frontend", "backend", "shared"],
  "scripts": {
    "dev:frontend": "npm run dev --workspace=frontend",
    "dev:backend": "npm run dev --workspace=backend",
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\""
  }
}
```

### Step 2: Create Next.js Frontend

```bash
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

Install frontend deps:
```bash
cd frontend
npm install axios zustand react-hook-form zod @hookform/resolvers
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label card table badge select dialog sheet
```

### Step 3: Create Express Backend

```bash
mkdir backend && cd backend
npm init -y
npm install express cors dotenv bcryptjs jsonwebtoken zod
npm install -D typescript ts-node nodemon @types/express @types/node @types/cors @types/bcryptjs @types/jsonwebtoken
```

`tsconfig.json` for backend:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Step 4: Set Up Prisma (if using PostgreSQL)

```bash
cd backend
npm install prisma @prisma/client
npx prisma init
```

### Step 5: Set Up Environment Variables

`.env.example` (root):
```env
# Backend
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/fhi_db"
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:5000/api"

# File Storage (Phase 3+)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

---

## 0.5 Express App Structure

`backend/src/app.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import { errorMiddleware } from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';
// import other routes as phases progress

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRoutes);
// More routes added per phase

// Global error handler (always last)
app.use(errorMiddleware);

export default app;
```

---

## 0.6 Database Schema — Core Tables (Phase 0 Seed)

This is the initial Prisma schema. It grows in each phase.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Users & Auth ────────────────────────────────────────────

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(SALES)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  quotes    Quote[]
}

enum Role {
  ADMIN
  TRADE_MANAGER
  SALES
  FINANCE
  OPERATIONS
}
```

> Remaining tables (Buyer, Product, Quote, CostTemplate, etc.) are added in Phase 1 and 2. Keeping Phase 0 schema minimal avoids overwhelming migrations.

---

## 0.7 Auth System Setup

### Backend — JWT Auth Flow

`auth.service.ts` responsibilities:
- `register(name, email, password, role)` — hash password, create user, return JWT
- `login(email, password)` — verify credentials, return JWT + user info
- `verifyToken(token)` — middleware use

### Frontend — Auth Flow

- Store JWT in `httpOnly` cookie (more secure) or `localStorage` (simpler for MVP)
- Axios interceptor attaches token to every request
- Protected routes via Next.js middleware (`middleware.ts`)

`frontend/middleware.ts`:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('fhi_token');
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 0.8 Deployment Setup

### Vercel (Frontend)
1. Push `frontend/` folder to GitHub
2. Connect repo to Vercel
3. Set root directory to `frontend`
4. Add env var: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api`

### Railway (Backend)
1. Create new Railway project
2. Add PostgreSQL plugin → copy `DATABASE_URL`
3. Deploy from GitHub, set root to `backend`
4. Add all env vars from `.env.example`

---

## 0.9 Phase 0 Completion Checklist

- [ ] Monorepo initialized with workspaces
- [ ] Next.js app running on `localhost:3000`
- [ ] Express API running on `localhost:5000`
- [ ] `/health` endpoint returns `{ status: "ok" }`
- [ ] Database connected (Prisma migrated or MongoDB connected)
- [ ] `User` table/collection created
- [ ] `/api/auth/register` and `/api/auth/login` working
- [ ] JWT token returned and verified
- [ ] Protected routes working in Next.js
- [ ] Login page UI built (basic)
- [ ] Dashboard layout shell built (sidebar + topbar)
- [ ] Deployed to Vercel + Railway staging
- [ ] `.env.example` committed, `.env` gitignored

---

## 0.10 Claude Code Tips for This Phase

When using Claude Code, prompt it with context like:

> "We are building the FHI Export Trade Calculator. Stack: Next.js 14 App Router, Express.js, Prisma + PostgreSQL, Tailwind, shadcn/ui. We are in Phase 0 — setting up auth. Here is the folder structure: [paste structure]. Now build the auth module."

Always give Claude Code:
1. The folder structure
2. The Prisma schema
3. The specific module you're working on

This prevents it from making assumptions that break your architecture.
