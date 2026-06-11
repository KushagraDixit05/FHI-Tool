# PHASE 4 — Dashboard, Analytics & CRM Features
**FHI Export Trade Calculator**
**Duration: 5–7 days**
**Goal: Actionable dashboard, analytics, and full CRM feature set**

---

## 4.1 Overview

By Phase 4, the core platform works. This phase makes it *intelligent and visible* — giving FHI leadership a real-time view of their trade pipeline, margins, and buyer activity.

By end of Phase 4:
- Home dashboard with key business metrics
- Quote pipeline analytics (by status, country, category)
- Buyer CRM features (notes, follow-ups, attachments)
- Margin and profitability analytics
- Quote comparison (supplier)
- Search across the entire platform

---

## 4.2 Dashboard — Widgets & Layout

`app/dashboard/page.tsx`

### Top Row — KPI Cards
```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Active Quotes  │ │ Pipeline Value  │ │  Avg Margin %   │ │  Won This Month │
│       18        │ │   AUD 142,500   │ │     19.4%       │ │        5        │
│  ↑ 3 vs last mo │ │  ↑ 12% vs prev  │ │  ↓ 1.2%        │ │  = same as prev │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Middle Row
```
┌──────────────────────────────┐  ┌────────────────────────────────────┐
│    Quote Pipeline (Kanban)   │  │   Revenue by Country (Bar Chart)   │
│  Draft | Sent | Approved...  │  │   AUS | NZL | JPN                  │
└──────────────────────────────┘  └────────────────────────────────────┘
```

### Bottom Row
```
┌───────────────────────────┐  ┌─────────────────────────────────────┐
│   Top Categories          │  │   Recent Activity Feed              │
│   by Margin %             │  │   - Quote #FHI-TXT-AUS approved     │
│   (Donut chart)           │  │   - New buyer: NZ Retailer added    │
└───────────────────────────┘  └─────────────────────────────────────┘
```

---

## 4.3 Backend — Analytics Endpoints

### Dashboard API

```
GET /api/analytics/dashboard
```

Returns all dashboard data in one call to minimize round-trips:

```typescript
interface DashboardData {
  kpis: {
    activeQuotes: number;
    activeQuotesDelta: number;           // vs last month
    pipelineValueInr: number;
    pipelineValueDelta: number;
    averageMarginPercent: number;
    averageMarginDelta: number;
    wonThisMonth: number;
    wonThisMonthDelta: number;
  };
  pipelineByStatus: Array<{
    status: QuoteStatus;
    count: number;
    totalValueInr: number;
  }>;
  revenueByCountry: Array<{
    country: string;
    totalValueInr: number;
    quoteCount: number;
  }>;
  marginByCategory: Array<{
    category: string;
    avgMargin: number;
    quoteCount: number;
  }>;
  recentActivity: Array<{
    type: 'QUOTE_CREATED' | 'STATUS_CHANGED' | 'BUYER_ADDED' | 'PDF_GENERATED';
    description: string;
    timestamp: string;
    quoteId?: string;
  }>;
}
```

### Analytics API

| Endpoint | Description |
|---|---|
| `GET /api/analytics/dashboard` | All dashboard data |
| `GET /api/analytics/quotes/by-status` | Quote counts and values by status |
| `GET /api/analytics/quotes/by-country` | Pipeline by destination country |
| `GET /api/analytics/quotes/by-category` | Quotes by product category |
| `GET /api/analytics/margins/trend` | Margin % trend over time |
| `GET /api/analytics/buyers/top` | Top buyers by quote value |
| `GET /api/analytics/products/top` | Most quoted products |

### Sample Query (Prisma)

```typescript
// Pipeline by status
const pipelineByStatus = await prisma.quote.groupBy({
  by: ['status'],
  _count: { id: true },
  _sum: { /* sum total value */ },
  where: {
    status: { not: 'LOST' },
    createdAt: { gte: startOfYear }
  }
});

// Margin by category (join through QuoteItem → Product → ProductType → ProductCategory)
const marginByCategory = await prisma.$queryRaw`
  SELECT
    pl.name as category,
    AVG(qi.margin_percent) as avg_margin,
    COUNT(DISTINCT q.id) as quote_count
  FROM quotes q
  JOIN quote_items qi ON q.id = qi.quote_id
  JOIN products p ON qi.product_id = p.id
  JOIN product_types pt ON p.product_type_id = pt.id
  JOIN product_categories pc ON pt.category_id = pc.id
  JOIN product_lines pl ON pc.product_line_id = pl.id
  WHERE q.status NOT IN ('DRAFT', 'LOST')
  GROUP BY pl.name
  ORDER BY avg_margin DESC
`;
```

---

## 4.4 Charts & Visualization

Use `recharts` (already available in Next.js ecosystem, lightweight):

```bash
cd frontend
npm install recharts
```

### Components to Build

#### 1. PipelineBarChart
```typescript
// Shows quote count + value by status
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function PipelineBarChart({ data }: { data: PipelineByStatus[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis dataKey="status" />
        <YAxis />
        <Tooltip formatter={(val) => `₹${Number(val).toLocaleString()}`} />
        <Bar dataKey="totalValueInr" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

#### 2. MarginDonutChart
```typescript
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

const COLORS = ['#1E3A5F', '#2563EB', '#60A5FA', '#93C5FD', '#DBEAFE', '#F0F9FF'];

export function MarginDonutChart({ data }: { data: MarginByCategory[] }) {
  return (
    <PieChart width={300} height={250}>
      <Pie data={data} dataKey="avgMargin" nameKey="category" innerRadius={60} outerRadius={90}>
        {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
      </Pie>
      <Legend />
      <Tooltip formatter={(val) => `${Number(val).toFixed(1)}%`} />
    </PieChart>
  );
}
```

#### 3. MarginTrendLineChart
```typescript
// Shows margin % over the last 6 months
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function MarginTrendChart({ data }: { data: { month: string; margin: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis domain={[0, 40]} tickFormatter={(v) => `${v}%`} />
        <Tooltip formatter={(v) => `${v}%`} />
        <Line type="monotone" dataKey="margin" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## 4.5 Buyer CRM Features

### Buyer Profile Page Enhancement

Add these sections to the existing buyer profile page:

#### Notes & Comments
```typescript
model BuyerNote {
  id          String   @id @default(cuid())
  buyerId     String
  buyer       Buyer    @relation(fields: [buyerId], references: [id])
  content     String
  isInternal  Boolean  @default(true)
  createdById String
  createdAt   DateTime @default(now())
}
```

```
GET /api/buyers/:id/notes
POST /api/buyers/:id/notes
DELETE /api/buyers/:id/notes/:noteId
```

#### Follow-up Reminders
```typescript
model FollowUp {
  id          String     @id @default(cuid())
  buyerId     String?
  quoteId     String?
  title       String
  description String?
  dueDate     DateTime
  isDone      Boolean    @default(false)
  createdById String
  createdAt   DateTime   @default(now())
}
```

```
GET /api/followups?due=today
POST /api/followups
PATCH /api/followups/:id/complete
```

Dashboard widget: **"Due Today"** — shows pending follow-ups for the logged-in user.

#### Buyer Quote History Table
Already available from Phase 1 buyer page, but now enrich it:
- Show all quotes with status, value, margin
- Quick action: Duplicate last quote for this buyer
- "Last contacted" calculated from most recent quote status change

#### Buyer Interest Tags
```typescript
// Add to Buyer model
productInterests  String[]   // ["Textiles", "Handicrafts"]
```

Simple multi-select in buyer form. Used later for filtering/segmentation.

---

## 4.6 Advanced Quote List Features

### Quote Comparison
Allow selecting 2-3 quotes and comparing side by side:

```typescript
// components/quotes/QuoteCompare.tsx
// Shows selected quotes in columns: buyer, product, total, margin, incoterm
```

### Bulk Actions
On the quote list page, add checkbox selection + bulk actions:
- Bulk status change (e.g., mark 5 drafts as "Under Review")
- Bulk export (download all selected as ZIP of PDFs)

### Quote Templates (Reusable)
Allow saving a quote as a template:
```typescript
model QuoteTemplate {
  id          String   @id @default(cuid())
  name        String
  description String?
  quoteData   Json     // snapshot of quote structure
  createdById String
  createdAt   DateTime @default(now())
}
```

When creating a new quote, offer "Start from Template" option.

---

## 4.7 Global Search

`GET /api/search?q={query}`

Search across:
- Buyers (name, company, email)
- Products (code, description)
- Quotes (quote number, buyer name)
- Suppliers (name)

```typescript
export async function globalSearch(query: string) {
  const [buyers, products, quotes, suppliers] = await Promise.all([
    prisma.buyer.findMany({
      where: { OR: [{ name: { contains: query, mode: 'insensitive' } }, { companyName: { contains: query, mode: 'insensitive' } }] },
      take: 5,
    }),
    prisma.product.findMany({
      where: { OR: [{ productCode: { contains: query, mode: 'insensitive' } }, { description: { contains: query, mode: 'insensitive' } }] },
      take: 5,
    }),
    prisma.quote.findMany({
      where: { OR: [{ quoteNumber: { contains: query, mode: 'insensitive' } }] },
      include: { buyer: { select: { companyName: true } } },
      take: 5,
    }),
    prisma.supplier.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      take: 5,
    }),
  ]);

  return { buyers, products, quotes, suppliers };
}
```

Frontend: Cmd+K / Ctrl+K command palette (use `cmdk` library or shadcn/ui Command component).

---

## 4.8 Activity Feed

Log key events to an activity table:

```typescript
model ActivityLog {
  id          String   @id @default(cuid())
  type        String                          // "QUOTE_CREATED", "STATUS_CHANGED", etc.
  description String
  quoteId     String?
  buyerId     String?
  userId      String
  metadata    Json?
  createdAt   DateTime @default(now())
}
```

Call `activityService.log(...)` after every significant action in controllers.

---

## 4.9 Notifications (In-App)

Simple in-app notification bell in the top navbar:

```typescript
model Notification {
  id        String   @id @default(cuid())
  userId    String
  title     String
  body      String
  isRead    Boolean  @default(false)
  link      String?  // e.g. "/quotes/cuid123"
  createdAt DateTime @default(now())
}
```

```
GET /api/notifications?unread=true
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

Trigger notifications for:
- Follow-up due tomorrow
- Quote status changed by another user
- New buyer added

---

## 4.10 Phase 4 Completion Checklist

### Backend
- [ ] Analytics dashboard endpoint returning all KPI data
- [ ] Quote pipeline by status query working
- [ ] Revenue by country query working
- [ ] Margin by category query working
- [ ] Margin trend over time query working
- [ ] Buyer notes CRUD API
- [ ] Follow-up CRUD API
- [ ] Global search endpoint (buyers, products, quotes, suppliers)
- [ ] Activity logging on all key actions
- [ ] Notification system (create, list, mark read)
- [ ] Quote template save/load API
- [ ] Bulk quote actions API

### Frontend
- [ ] Dashboard page with all 4 KPI cards
- [ ] Pipeline bar chart rendering
- [ ] Revenue by country bar chart
- [ ] Margin by category donut chart
- [ ] Margin trend line chart
- [ ] Recent activity feed
- [ ] Follow-up "Due Today" widget
- [ ] Buyer profile page with notes, follow-ups, quote history
- [ ] Cmd+K global search command palette
- [ ] Notification bell with unread count
- [ ] Quote comparison view
- [ ] Quote templates (save + start from template)

---

## 4.11 Claude Code Prompts for This Phase

**For Analytics Queries:**
> "Write Prisma queries for an export trade platform dashboard. I need: (1) active quote count + pipeline value grouped by status, (2) revenue by destination country for current year, (3) average margin % grouped by product category, (4) margin % trend by month for last 6 months. Here is the Prisma schema: [paste]"

**For Dashboard Page:**
> "Build a Next.js dashboard page for the FHI export platform. It should fetch data from GET /api/analytics/dashboard and display: 4 KPI cards with delta indicators, a pipeline bar chart using recharts, a donut chart for margin by category, a recent activity feed, and a due follow-ups widget. Use shadcn/ui Card components and Tailwind."

**For Global Search:**
> "Implement a Cmd+K global search command palette in Next.js using the shadcn/ui Command component. It calls GET /api/search?q= on input change (debounced 200ms), and shows grouped results: Quotes, Buyers, Products, Suppliers. Clicking a result navigates to the relevant page."
