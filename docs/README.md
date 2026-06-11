# FHI Export Trade Calculator — Implementation Plan
**Flourish High International**
**Solo Developer | Next.js + Node/Express + PostgreSQL + Prisma**
**Deployment: Vercel (Frontend) + Railway/Render (Backend)**

---

## Overview

This folder contains the complete phase-wise implementation plan for building the FHI Export Trade Calculator platform.

---

## Phase Files

| File | Phase | Duration | Focus |
|---|---|---|---|
| `PHASE-0-Setup-and-Architecture.md` | Phase 0 | 3–5 days | Monorepo, auth, DB, deployment skeleton |
| `PHASE-1-Master-Data-and-Buyers.md` | Phase 1 | 7–10 days | Buyers, products, suppliers, master data |
| `PHASE-2-Costing-Engine-and-Quote-Builder.md` | Phase 2 | 10–14 days | Core costing engine, quote builder, CRM |
| `PHASE-3-Document-Generation-and-PDFs.md` | Phase 3 | 5–7 days | Branded PDF generation (buyer + internal docs) |
| `PHASE-4-Dashboard-Analytics-and-CRM.md` | Phase 4 | 5–7 days | Dashboard, charts, analytics, CRM features |
| `PHASE-5-Polish-RBAC-and-Production.md` | Phase 5 | 5–7 days | RBAC, security, polish, production launch |
| `PHASE-6-Future-Roadmap.md` | Phase 6 | Post-launch | AI, portals, notifications, marketplace |

---

## Total Timeline

| Milestone | Estimated Days |
|---|---|
| MVP Phases 0–5 | ~35–50 days |
| Post-Launch Phase 6 | Ongoing |

---

## Tech Stack Summary

```
Frontend:   Next.js 14 (App Router) + Tailwind CSS + shadcn/ui + Zustand
Backend:    Node.js + Express.js + Prisma ORM
Database:   PostgreSQL (Railway) — or MongoDB (see Phase 0)
Auth:       JWT + bcrypt
PDF:        Puppeteer (server-side) + Handlebars templates
Charts:     Recharts
Hosting:    Vercel (FE) + Railway/Render (BE)
```

---

## How to Use These Files with Claude Code

Each phase file ends with **"Claude Code Prompts for This Phase"** — copy those prompts directly into Claude Code for maximum efficiency.

**General pattern:**
1. Read the phase file fully before starting
2. Set up the folder structure first
3. Build backend (schema → routes → controller → service)
4. Build frontend (page → components → hooks)
5. Test end-to-end
6. Check off the completion checklist
7. Move to next phase

**Tip:** At the start of each Claude Code session, paste:
> "We are building the FHI Export Trade Calculator. Stack: Next.js 14 App Router, Express.js, Prisma + PostgreSQL, Tailwind, shadcn/ui. We are currently in [Phase X]. Here is the relevant context from the phase plan: [paste section]"
