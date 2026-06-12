---
name: prod-readiness-status
description: FHI platform production-readiness work — what's done and what remains
metadata:
  type: project
---

Frontend production-readiness pass (June 2026) — completed:
- Wired design tokens into Tailwind v4 via `@theme inline` in `app/globals.css` (was a Tailwind v4 install with NO theme mapping, so `:root` HSL tokens were dead and pages used inline `style={{ background: var(--fhi-navy) }}`). Now `bg-primary`, `text-muted-foreground`, `bg-navy`, etc. work.
- Built CVA-based primitive library in `frontend/components/ui/` (barrel: `components/ui/index.ts`): Button, Input, Textarea, Select (native, to keep RHF `register()` working), Label, FormField, Card, Skeleton/SkeletonCard, Badge. Import from `@/components/ui`.
- Migrated all dashboard + auth pages off ~55 hand-rolled buttons / inline navy hacks and per-file FIELD_CLASS/LABEL_CLASS constants. Zero `style={{ background: var(--fhi-navy) }}` remain. Added Skeleton loaders to detail pages.
- `npm run build` (Next 16.2.9 Turbopack) and `tsc --noEmit` both pass.

Backend production-readiness pass (June 2026) — completed:
- Created `backend/src/shared/` (was empty): `errors/AppError.ts` (AppError class + badRequest/unauthorized/forbidden/notFound/conflict factories), `http/asyncHandler.ts`, `http/pagination.ts` (getPagination + paginatedResult). Barrel at `shared/index.ts`.
- FIXED REAL BUG: services threw `Object.assign(new Error(...), { statusCode })` in 16 places but `error.middleware.ts` never read `statusCode` → every intended 404/409/401/422 returned 500. Now error middleware handles `AppError` (+ a defensive numeric-statusCode fallback). All 16 throws converted to `new AppError(...)`.
- Wrapped all 8 controllers in `asyncHandler` — removed 41 try/catch `next(err)` blocks.
- Replaced duplicated pagination return shape with `paginatedResult()` in buyers/products/quotes/suppliers services.
- Security hardening: added `helmet` + `express-rate-limit` deps. `app.ts` now uses helmet, an apiLimiter (300/15min on /api) and stricter authLimiter (20/15min on /api/auth), plus a JSON `notFoundHandler` for unmatched routes (was Express default HTML 404).
- `npm run build` (tsc) passes; runtime smoke test confirmed helmet headers, JSON 404 + ratelimit headers, and 401 on unauthed routes. Note: needs `npx prisma generate` before running (client wasn't generated).

Remaining debt (NOT yet done):
- FRONTEND: data fetching is `useEffect` + `setState` in every list/detail page → `react-hooks/set-state-in-effect` eslint errors (build still passes). Proper fix = adopt React Query/SWR. `hooks/useApi.ts` exists but barely used. Main open scalability item.
- FRONTEND: ~15 pre-existing eslint warnings (unused vars) + `react/no-unescaped-entities` errors in StatusTimeline.
- FRONTEND: Next 16 warns `middleware` convention deprecated → rename to `proxy` (`frontend/middleware.ts`).
- FRONTEND: Sidebar/Topbar icon buttons intentionally left as bespoke navy chrome.
- BACKEND: no automated tests yet. Costing engine (`costing.engine.ts`, pure fn) is the highest-value unit-test target. No request-id/structured access logging beyond winston debug.
