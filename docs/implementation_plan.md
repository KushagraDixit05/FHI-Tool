# FHI Export Trade Calculator — Implementation Plan

## Context & Current State

Full codebase audit completed. Here is what exists and what is missing:

### ✅ Fully Implemented (DO NOT TOUCH)
- Monorepo root workspace setup
- Express app (`app.ts`, `index.ts`) with CORS, JSON parsing, request logging, health check
- All 4 middleware: `auth.middleware.ts`, `error.middleware.ts`, `role.middleware.ts`, `validate.middleware.ts`
- Auth module: `auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.schema.ts` (JWT + bcrypt — fine for now)
- Prisma schema: **full schema already written through Phase 4** — all models exist
- Seed data: product lines, categories, types, currency rates, port charges, freight templates, admin user
- DB config (`db.ts`), env validation (`env.ts`), logger (`config/logger.ts`)
- Frontend: `globals.css` (design tokens), `layout.tsx` (root + dashboard), `Sidebar.tsx`, `Topbar.tsx`
- Auth store (`auth.store.ts`), Axios instance (`lib/api.ts`), Next.js `middleware.ts`
- Login page (`(auth)/login/page.tsx`) — complete with form validation
- Dashboard page (`(dashboard)/dashboard/page.tsx`) — exists (9KB, likely full)
- Quotes list page (`(dashboard)/quotes/page.tsx`) — exists (stub)

### ❌ Missing — Backend (Empty Module Directories)
- `modules/buyers/` — no files
- `modules/products/` — no files  
- `modules/suppliers/` — no files
- `modules/master-data/` — no files
- `modules/costing/` — no files
- `modules/quotes/` — no files
- `modules/users/` — no files

### ❌ Missing — Frontend
- `shared/types/` — empty
- `shared/constants/` — empty
- `frontend/types/` — exists but unknown contents
- `frontend/constants/` — exists but unknown contents
- `frontend/hooks/` — exists but unknown contents
- All buyer/product/supplier/quotes/settings pages (stubs or empty)
- All feature components (DataTable, forms, etc.)

---

## User Review Required

> [!IMPORTANT]
> **Zod Version Mismatch**: Frontend uses `zod@^4.4.3`, backend uses `zod@^3.23.8`. These are **different major versions with different APIs** (e.g. `z.string().email()` works in both, but `z.infer` imports differ). The `shared/` package cannot share Zod schemas directly without picking one version. **Decision: Keep Zod v3 on backend (stable, all existing code), keep Zod v4 on frontend (already installed). Shared types will be plain TypeScript interfaces, not Zod schemas.**

> [!IMPORTANT]
> **Auth Strategy**: Current implementation uses JWT + bcrypt (password-based). You said you want Google OAuth but keep JWT as a future fallback. **For now, I will leave the existing auth module untouched** — it works for local development. We add Google OAuth in Phase 5. The `password` field in the schema is already nullable in the actual DB model (I'll verify). This means you can still log in with the seeded admin credentials during development.

> [!NOTE]
> **Prisma Schema is already complete** — it covers Phases 0–4 models. No schema migrations are needed to proceed. We just need to implement the API and UI layers on top of it.

---

## Open Questions

> [!IMPORTANT]
> **Do you have a `.env` file set up locally with a running PostgreSQL database?** The backend cannot start without `DATABASE_URL`. If not, we need to set that up first before implementing any modules that require DB access.

---

## Setup & Remaining Steps to Complete MVP

> Status snapshot (verified June 2026): all backend modules and frontend pages are built and both apps compile. The items below are what remains to make this a fully usable, shippable MVP. Suggested order: **1 → 2 → 3 → 4 → 5**.

### 1. 🔴 Blocker — Database setup (nothing runs until this is done)
The database has **never been migrated** (`backend/prisma/migrations/` does not exist) and the Prisma client was not generated. Schema and seed are ready.

- [ ] Confirm `backend/.env` has a valid `DATABASE_URL` pointing at a running PostgreSQL instance.
- [ ] `cd backend && npx prisma generate`
- [ ] `npx prisma migrate dev --name init` — creates all tables.
- [ ] `npx prisma db seed` — loads product lines/categories/types, currency rates, freight & port templates, and the **admin user**.
- [ ] Boot the API (`npm run dev`) and confirm login with the seeded admin credentials.

Until this is done, **every API call fails** — this is step zero.

### 2. 🟠 Missing pages — UI links that currently 404
"Edit" buttons point at routes that don't exist yet. Buyers is the only complete CRUD slice — **use it as the template** (`BuyerForm` + `buyers/[id]/edit`).

- [ ] `frontend/app/(dashboard)/products/[id]/edit/page.tsx` — linked from product detail "Edit".
- [ ] `frontend/app/(dashboard)/quotes/[id]/edit/page.tsx` — linked from quote detail "Edit" (DRAFT only); backend `updateQuote` already exists.
- [ ] `frontend/app/(dashboard)/suppliers/[id]/edit/page.tsx` — linked from suppliers list "Edit"; extract a shared `SupplierForm` first (the create form is inline in `suppliers/new`).

### 3. 🟠 PDF quote generation — advertised but not built
`puppeteer` + `handlebars` are installed and the login screen advertises "PDF Quotations," but `backend/src/modules/documents/` is empty and nothing is wired. **Decide if MVP-critical or fast-follow.**

- [ ] HTML quote template (Handlebars).
- [ ] `document.service.ts` — render template → PDF via Puppeteer.
- [ ] `GET /api/quotes/:id/pdf` route, wired in `app.ts`.
- [ ] "Download PDF" button on the quote detail page.

### 4. 🟡 Quality & hardening (production-readiness debt)
- [ ] **Frontend data layer:** replace per-page `useEffect`+`setState` fetching with **React Query/SWR** (fixes redundant re-renders + the `react-hooks/set-state-in-effect` lint errors). Biggest scalability lever; `hooks/useApi.ts` exists but is barely used.
- [ ] **Tests:** set up Vitest; highest-value target is `backend/src/modules/costing/costing.engine.ts` (pure function, all 5 incoterms) — a silent math bug there costs real money.
- [ ] **Lint cleanup:** ~15 unused-var warnings + `react/no-unescaped-entities` errors in `StatusTimeline`.
- [ ] **Next 16:** rename `frontend/middleware.ts` → `proxy` (deprecation warning).

### 5. 🟢 Ship it
- [ ] `Dockerfile` per app + `docker-compose.yml` (with Postgres) for one-command startup.
- [ ] Document production env vars: `JWT_SECRET` (≥32 chars), `DATABASE_URL`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`.
- [ ] Basic CI: build + typecheck + lint on push.

> Already completed in the production-readiness pass: frontend primitive component library + design tokens; backend `shared/` utilities (`AppError`, `asyncHandler`, pagination); fixed the error-middleware bug where thrown `statusCode`s were ignored (404/409 → 500); `helmet` + rate limiting + JSON 404 handler.

---

## Execution Order

**Phase 1A — Shared Foundation** (both FE + BE benefit from this first)
→ Shared TypeScript types, backend shared Zod schemas, frontend constants, reusable DataTable component

**Phase 1B — Backend: Master Data APIs**
→ `buyers`, `products`, `suppliers`, `master-data` modules (routes → controller → service pattern)
→ Wire all routes into `app.ts`

**Phase 1C — Frontend: Master Data Pages**  
→ Buyers list + create/edit, Products catalog, Suppliers, Master Data settings

**Phase 2A — Backend: Costing Engine + Quotes API**
→ Pure `costing.engine.ts`, quote number generator, full quotes CRUD + status machine

**Phase 2B — Frontend: Quote Builder**
→ Multi-step wizard, live costing preview, quote detail page, CRM pipeline

---

## Proposed Changes

### Phase 1A — Shared Foundation

#### [NEW] `shared/types/index.ts`
All shared TypeScript interfaces: `User`, `Buyer`, `Product`, `ProductLine`, `ProductCategory`, `ProductType`, `Supplier`, `Quote`, `QuoteItem`, `QuoteCost`, `FreightTemplate`, `PortChargeTemplate`, `CurrencyRate`, `PaginatedResponse<T>`.

#### [NEW] `shared/constants/index.ts`
`CURRENCIES`, `BUYER_CATEGORIES`, `INCOTERMS`, `QUOTE_STATUSES`, `COST_CATEGORIES`, `COUNTRIES` array, `PORTS` list.

#### [NEW] `frontend/types/index.ts`
Re-export from `shared/types` + any frontend-only types.

#### [NEW] `frontend/constants/index.ts`
Re-export from `shared/constants` + any frontend-only constants.

#### [NEW] `frontend/components/ui/DataTable.tsx`
Reusable table component with: column definitions, pagination, search bar, row actions. Used for Buyers, Products, Suppliers, Quotes.

#### [NEW] `frontend/components/ui/EmptyState.tsx`
Generic empty state with icon, title, description, optional CTA.

#### [NEW] `frontend/components/ui/PageHeader.tsx`
Consistent page header: title, subtitle, right-side action button slot.

#### [NEW] `frontend/components/ui/StatusBadge.tsx`
Color-coded badge for QuoteStatus values.

#### [NEW] `frontend/store/master-data.store.ts`
Zustand store for: `productLines`, `currencies`, `freightTemplates` — fetched once on dashboard load.

#### [NEW] `frontend/hooks/useApi.ts`
Generic typed wrapper around axios for data fetching with loading/error state.

---

### Phase 1B — Backend: All Phase 1 Modules

#### [MODIFY] `backend/src/app.ts`
Add imports and `app.use()` for all new route modules.

---

#### [NEW] `backend/src/modules/buyers/buyer.schema.ts`
Zod v3 schemas: `createBuyerSchema`, `updateBuyerSchema`, `listBuyersQuerySchema`.

#### [NEW] `backend/src/modules/buyers/buyer.service.ts`
- `listBuyers(query)` — paginated with search + filters
- `getBuyerById(id)` — with quote count
- `createBuyer(data)` 
- `updateBuyer(id, data)` 
- `softDeleteBuyer(id)` — sets `isActive = false`
- `getBuyerQuotes(id)` — paginated quote history

#### [NEW] `backend/src/modules/buyers/buyer.controller.ts`
Thin controllers that call service, handle HTTP layer.

#### [NEW] `backend/src/modules/buyers/buyer.routes.ts`
All 6 buyer endpoints, protected by `authMiddleware`.

---

#### [NEW] `backend/src/modules/products/product.schema.ts`
Zod schemas for create/update product, attribute schemas per category (textile, spice, handicraft, carpet, stationery, cotton bag).

#### [NEW] `backend/src/modules/products/product.service.ts`
- `getProductLines()`
- `getCategoriesByLine(lineId)`
- `getTypesByCategory(categoryId)`
- `listProducts(query)` — paginated, filterable by line/category/type
- `getProductById(id)`
- `createProduct(data)`
- `updateProduct(id, data)`
- `searchProducts(q)` — for quote builder typeahead

#### [NEW] `backend/src/modules/products/product.controller.ts`

#### [NEW] `backend/src/modules/products/product.routes.ts`
All product endpoints with auth.

---

#### [NEW] `backend/src/modules/suppliers/supplier.schema.ts`
#### [NEW] `backend/src/modules/suppliers/supplier.service.ts`
- `listSuppliers(query)`, `getSupplierById(id)`, `createSupplier(data)`, `updateSupplier(id, data)`

#### [NEW] `backend/src/modules/suppliers/supplier.controller.ts`
#### [NEW] `backend/src/modules/suppliers/supplier.routes.ts`

---

#### [NEW] `backend/src/modules/master-data/master.schema.ts`
#### [NEW] `backend/src/modules/master-data/master.service.ts`
- `getCurrencyRates()`
- `upsertCurrencyRate(data)`
- `getFreightTemplates(query)` — filterable by country
- `createFreightTemplate(data)`
- `getPortCharges()`
- `upsertPortCharge(data)`
- `getStaticData()` — returns `{ incoterms, ports }` from constants

#### [NEW] `backend/src/modules/master-data/master.controller.ts`
#### [NEW] `backend/src/modules/master-data/master.routes.ts`

---

#### [NEW] `backend/src/modules/users/user.schema.ts`
#### [NEW] `backend/src/modules/users/user.service.ts`
- `listUsers()`, `createUser(data)`, `updateUserRole(id, role)`, `toggleUserActive(id)` — all Admin only

#### [NEW] `backend/src/modules/users/user.controller.ts`
#### [NEW] `backend/src/modules/users/user.routes.ts`
All routes wrapped with `authMiddleware` + `requireRole('ADMIN')`.

---

### Phase 1C — Frontend: Master Data Pages

#### [NEW] `frontend/app/(dashboard)/buyers/page.tsx`
Buyer list with DataTable, search, create button. Fetches `GET /api/buyers`.

#### [NEW] `frontend/app/(dashboard)/buyers/new/page.tsx`
Create buyer form with React Hook Form + Zod. `POST /api/buyers`.

#### [NEW] `frontend/app/(dashboard)/buyers/[id]/page.tsx`
Buyer detail: info card + quote history table.

#### [NEW] `frontend/app/(dashboard)/buyers/[id]/edit/page.tsx`
Edit buyer form (prefilled). `PUT /api/buyers/:id`.

#### [NEW] `frontend/app/(dashboard)/products/page.tsx`
Product catalog with filter by line/category, search.

#### [NEW] `frontend/app/(dashboard)/products/new/page.tsx`
3-step product creation wizard with dynamic category fields.

#### [NEW] `frontend/app/(dashboard)/products/[id]/page.tsx`
Product detail page.

#### [NEW] `frontend/app/(dashboard)/suppliers/page.tsx`
#### [NEW] `frontend/app/(dashboard)/suppliers/new/page.tsx`

#### [NEW] `frontend/app/(dashboard)/settings/master-data/page.tsx`
Tabbed settings: Currency Rates | Freight Templates | Port Charges.

#### [NEW] `frontend/components/buyers/BuyerForm.tsx`
#### [NEW] `frontend/components/products/ProductForm.tsx`
#### [NEW] `frontend/components/products/CategoryAttributeFields.tsx`
#### [NEW] `frontend/components/suppliers/SupplierForm.tsx`

---

### Phase 2A — Backend: Costing Engine + Quotes

#### [NEW] `backend/src/modules/costing/costing.engine.ts`
Pure TypeScript calculation function — no DB. `CostingInput` → `CostingResult`. All 5 incoterm filters implemented. Profitability scoring. Container calculation helper.

#### [NEW] `backend/src/modules/costing/costing.controller.ts`
#### [NEW] `backend/src/modules/costing/costing.routes.ts`
- `POST /api/costing/calculate` — run engine, return result (no save)
- `GET /api/costing/incoterm-costs/:incoterm` — return cost inclusion map

#### [NEW] `backend/src/modules/quotes/quote-number.service.ts`
`generateQuoteNumber(categoryCode, countryCode, prisma)` — format `FHI-TXT-AUS-2026-00021`.

#### [NEW] `backend/src/modules/quotes/quote.schema.ts`
#### [NEW] `backend/src/modules/quotes/quote.service.ts`
- `createQuote(data, userId)` — creates quote + items + costs atomically in a Prisma transaction, logs status history
- `listQuotes(query)` — paginated, filterable by status/buyer/date
- `getQuoteById(id)` — full quote with all relations
- `updateQuote(id, data)` — only DRAFT quotes
- `updateQuoteStatus(id, toStatus, userId, note)` — validates transition, logs history
- `deleteQuote(id)` — only DRAFT
- `duplicateQuote(id, userId)` — copies quote + items + costs with new quote number

#### [NEW] `backend/src/modules/quotes/quote.controller.ts`
#### [NEW] `backend/src/modules/quotes/quote.routes.ts`
All endpoints with auth + role guards per doc spec.

---

### Phase 2B — Frontend: Quote Builder

#### [NEW] `frontend/app/(dashboard)/quotes/new/page.tsx`
6-step wizard orchestrator using a shared form context.

#### [NEW] `frontend/app/(dashboard)/quotes/[id]/page.tsx`
Full quote detail: header, items table, cost breakdown accordion, profitability panel, CRM timeline, actions bar.

#### [MODIFY] `frontend/app/(dashboard)/quotes/page.tsx`
Upgrade stub to full list with filters, stats bar, DataTable.

#### [NEW] `frontend/components/quotes/QuoteBuilder/`
Step components: `Step1_BuyerSelect.tsx`, `Step2_Settings.tsx`, `Step3_Products.tsx`, `Step4_LogisticsCosts.tsx`, `Step5_OperationalCosts.tsx`, `Step6_Review.tsx`.

#### [NEW] `frontend/components/quotes/CostingPreviewPanel.tsx`
Live sidebar showing unit cost breakdown, selling price, margin, profitability score.

#### [NEW] `frontend/components/quotes/StatusTimeline.tsx`
CRM history log component.

#### [NEW] `frontend/hooks/useCosting.ts`
Debounced costing calculation hook.

#### [NEW] `frontend/hooks/useQuoteBuilder.ts`
Shared form state management across wizard steps.

---

## Verification Plan

### After Phase 1B (Backend):
```bash
cd backend
npm run dev
# Verify:
curl http://localhost:5000/health
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@flourishhigh.com","password":"Admin@123"}'
# Use returned token to test:
curl http://localhost:5000/api/buyers -H "Authorization: Bearer <token>"
curl http://localhost:5000/api/products/lines -H "Authorization: Bearer <token>"
curl http://localhost:5000/api/master/currencies -H "Authorization: Bearer <token>"
```

### After Phase 1C (Frontend):
- Navigate to `/buyers` → see list (empty state if no data)
- Create a buyer → form validation works → buyer appears in list
- Create a product through the 3-step wizard
- Check `/settings/master-data` → currency rates and freight templates visible

### After Phase 2A (Costing Engine):
```bash
curl -X POST http://localhost:5000/api/costing/calculate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ ...test payload with EXW, FOB, CIF, CFR, DDP }' 
# Verify output values against manual spreadsheet calculation
```

### After Phase 2B (Quote Builder):
- Create a full end-to-end quote from `/quotes/new`
- Verify live preview updates as costs are entered
- Verify quote number format: `FHI-TXT-AUS-2026-00001`
- Verify status transition: `DRAFT → UNDER_REVIEW → SENT_TO_BUYER`
- Duplicate a quote → new quote number assigned
