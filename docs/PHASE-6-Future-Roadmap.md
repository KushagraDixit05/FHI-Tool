# PHASE 6 — Future Roadmap (Post-MVP Enhancements)
**FHI Export Trade Calculator**
**Post-Launch — Build as needed**
**Goal: AI features, supplier portal, buyer portal, marketplace foundation**

---

## 6.1 Overview

Phase 6 is not a fixed-timeline phase — it's a **living roadmap** of features to build after the MVP is live and being used. Prioritize based on what FHI actually needs after launch.

Each feature is **independent** — they can be built in any order.

---

## 6.2 Feature: Live Currency Exchange Rates

### Current State (MVP)
Currency rates are manually entered in the Master Data settings.

### Enhancement
Integrate a live exchange rate API:

**Recommended free tier:** ExchangeRate-API or Open Exchange Rates

```typescript
// backend/src/jobs/currency-sync.job.ts

// Run daily at 9 AM IST via cron
import cron from 'node-cron';

cron.schedule('0 3 * * *', async () => {   // 3 AM UTC = 8:30 AM IST
  const response = await fetch(
    `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/INR`
  );
  const data = await response.json();

  const targetCurrencies = ['AUD', 'NZD', 'JPY', 'USD', 'EUR'];

  for (const currency of targetCurrencies) {
    await prisma.currencyRate.create({
      data: {
        fromCurrency: 'INR',
        toCurrency: currency as Currency,
        rate: data.conversion_rates[currency],
        source: 'LIVE',
      }
    });
  }

  logger.info('Currency rates synced from live API');
});
```

Show a "Live Rate" badge next to rates fetched automatically. Allow manual override with a "Lock Rate" button (useful for locking a rate when creating a quote).

---

## 6.3 Feature: AI Pricing Suggestions

### What It Does
When creating a quote, an AI assistant suggests:
- Recommended margin % for the product category + destination country
- Estimated freight cost range
- Similar past quotes with their outcomes

### Implementation

Use Anthropic Claude API (or OpenAI) on the backend:

```typescript
// POST /api/ai/pricing-suggestion

export async function getPricingSuggestion(req: Request, res: Response) {
  const { productCategory, destinationCountry, quantity, unitCost } = req.body;

  // Pull historical quote data for context
  const historicalQuotes = await prisma.quote.findMany({
    where: {
      buyer: { country: destinationCountry },
      items: { some: { product: { productType: { category: { productLine: { name: productCategory } } } } } },
      status: { in: ['APPROVED', 'PO_RECEIVED', 'CLOSED'] },
    },
    include: { items: true },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  const prompt = `
    You are an export trade advisor for Flourish High International, an Indian exporter.
    
    Context:
    - Product Category: ${productCategory}
    - Destination: ${destinationCountry}
    - Quantity: ${quantity} units
    - Unit Cost: INR ${unitCost}
    
    Historical successful quotes for similar products to ${destinationCountry}:
    ${JSON.stringify(historicalQuotes.map(q => ({
      margin: q.items[0]?.marginPercent,
      status: q.status,
    })))}
    
    Suggest:
    1. Recommended margin % range (with reasoning)
    2. Any pricing risks to consider (currency, competition, seasonality)
    3. Whether this quantity is optimal for container economics
    
    Respond in JSON: { recommendedMarginMin, recommendedMarginMax, reasoning, risks, containerNote }
  `;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  });

  res.json(JSON.parse(response.content[0].text));
}
```

Frontend: Show as a collapsible "AI Suggestion" panel in Step 3 of the quote builder.

---

## 6.4 Feature: Supplier Portal

### What It Is
A separate login for suppliers where they can:
- View RFQs (Request for Quotations) from FHI
- Submit pricing and availability
- Upload product images and certifications
- Update their MOQ and lead times

### Architecture
Add a `SUPPLIER` role to the auth system. Suppliers only see their own data — quotes where they've been tagged as the supplier.

### Supplier Dashboard
```
- Open RFQs from FHI
- My submitted prices
- My product catalog
- My certifications (upload/update)
- Order history
```

### New Tables Required
```prisma
model SupplierRFQ {
  id          String   @id @default(cuid())
  supplierId  String
  productId   String
  quantity    Int
  requiredBy  DateTime
  status      RFQStatus
  response    SupplierRFQResponse?
  createdAt   DateTime @default(now())
}

model SupplierRFQResponse {
  id          String   @id @default(cuid())
  rfqId       String   @unique
  unitPrice   Decimal
  leadTimeDays Int
  moq         Int
  validUntil  DateTime
  notes       String?
  createdAt   DateTime @default(now())
}
```

---

## 6.5 Feature: Buyer Portal

### What It Is
A limited portal for buyers to:
- Request quotations
- View quotes sent to them
- Accept/request revision on quotes
- Track shipment status
- View order history

### Architecture
Add a `BUYER_USER` role. Buyers only see their own quotes.

### Buyer Portal Pages
```
/buyer-portal/
├── dashboard           # Active quotes, recent orders
├── request-quote       # Simple form to request a quote
├── quotes/[id]         # View a specific quotation
└── orders              # Order/shipment history
```

---

## 6.6 Feature: Profitability Analytics Dashboard

A dedicated analytics page for deep business intelligence:

### Dashboard Sections

**1. Margin Intelligence**
- Margin trend by month (line chart)
- Margin by product category (bar chart)
- Margin by destination country (heatmap-style table)
- Margin by buyer category (distributor vs retailer vs hospitality)

**2. Quote Funnel**
- Quote count at each pipeline stage
- Win rate % (Approved / Total sent)
- Average days from Draft to Approved
- Lost reason analysis

**3. Buyer Performance**
- Top 10 buyers by quote value
- Repeat vs new buyer ratio
- Average quotes per buyer
- Country-wise buyer distribution

**4. Product Performance**
- Most quoted products
- Products with highest margin
- Products with most repeat orders
- MOQ achievement rate

**5. Supplier Performance**
- Quotes per supplier
- Average cost competitiveness
- Lead time reliability

### Export Options
All analytics sections exportable as:
- CSV (data table)
- PDF report

---

## 6.7 Feature: Shipment Tracking Integration

After a quote reaches `SHIPMENT_PLANNED` status, allow linking a shipping tracking number:

```typescript
model Shipment {
  id              String   @id @default(cuid())
  quoteId         String   @unique
  trackingNumber  String?
  carrier         String?  // "Maersk", "MSC", "Hapag-Lloyd"
  containerNumber String?
  etd             DateTime? // Estimated Time of Departure
  eta             DateTime? // Estimated Time of Arrival
  status          ShipmentStatus @default(PLANNED)
  notes           String?
  createdAt       DateTime @default(now())
}

enum ShipmentStatus {
  PLANNED
  BOOKING_CONFIRMED
  CARGO_RECEIVED
  VESSEL_DEPARTED
  IN_TRANSIT
  ARRIVED
  CUSTOMS_CLEARED
  DELIVERED
}
```

### Carrier API Integration (optional)
Integrate with Searates or ShipsGo API to auto-fetch tracking status by container number.

---

## 6.8 Feature: WhatsApp / Email Notifications

### WhatsApp (via Twilio or WATI)
Send quote PDF directly to buyer's WhatsApp:

```typescript
// POST /api/quotes/:id/send-whatsapp
// Generates PDF → uploads to temporary URL → sends via WhatsApp Business API

await whatsappClient.sendMessage({
  to: `whatsapp:${buyer.phone}`,
  body: `Hi ${buyer.name}, please find attached our quotation ${quote.quoteNumber} from Flourish High International.`,
  mediaUrl: [temporaryPdfUrl],
});
```

### Email (via Resend or SendGrid)
Send quotation email with PDF attachment:

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'quotes@flourishhigh.com',
  to: buyer.email,
  subject: `Quotation ${quote.quoteNumber} — Flourish High International`,
  html: emailTemplate,
  attachments: [{ filename: `${quote.quoteNumber}.pdf`, content: pdfBuffer }],
});
```

---

## 6.9 Feature: Pricing Templates

Allow saving commonly used cost structures as templates:

```typescript
model PricingTemplate {
  id          String   @id @default(cuid())
  name        String   // e.g. "Standard AUS FOB Textile"
  category    String   // product line
  incoterm    String
  costDefaults Json    // pre-filled logistics costs
  marginDefault Decimal
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

When starting a new quote, user selects a pricing template and all cost fields are pre-filled. This dramatically speeds up quote creation for repeat scenarios.

---

## 6.10 Feature: Multi-Product Quote Optimization

For quotes with multiple product lines (e.g., textiles + handicrafts), add:

**Shared Cost Allocation:** Distribute shared costs (freight, CHA, port) proportionally across products by weight or CBM.

**Bundle Discount:** If buyer orders from 2+ categories, automatically apply a configurable bundle discount %.

**Container Mix Optimizer:** Given multiple products, suggest the optimal container split (e.g., "These 3 products fit in 1 × 40ft + 1 × 20ft — saving AUD 1,200 in freight vs 2 × 40ft").

---

## 6.11 Technology Additions for Phase 6

| Feature | New Technology |
|---|---|
| Live currency rates | ExchangeRate-API + node-cron |
| AI suggestions | Anthropic Claude API |
| Email sending | Resend (simple, generous free tier) |
| WhatsApp sending | Twilio or WATI |
| Shipment tracking | Searates API |
| Job queues (heavy tasks) | BullMQ + Redis |
| Caching (analytics) | Redis |

---

## 6.12 Prioritization Guide

After Phase 5 (MVP live), prioritize Phase 6 features based on FHI's actual pain points:

**If quoting is slow:** → Pricing Templates first
**If margins are unpredictable:** → Live Currency Rates first
**If buyers ask for status updates:** → Buyer Portal or Email/WhatsApp first
**If analytics are needed for decisions:** → Profitability Dashboard first
**If supplier pricing is manual:** → Supplier Portal first

Build only what creates real business value. Avoid building features nobody uses.

---

## 6.13 Summary — Full Phase Timeline

| Phase | Focus | Duration |
|---|---|---|
| **Phase 0** | Project setup, auth, deployment skeleton | 3–5 days |
| **Phase 1** | Buyers, products, suppliers, master data | 7–10 days |
| **Phase 2** | Costing engine, quote builder, CRM pipeline | 10–14 days |
| **Phase 3** | PDF generation, branded documents | 5–7 days |
| **Phase 4** | Dashboard, analytics, CRM features | 5–7 days |
| **Phase 5** | RBAC, security, polish, production launch | 5–7 days |
| **Phase 6** | AI, portals, notifications, advanced analytics | Ongoing |
| | **Total MVP (Phases 0–5)** | **~35–50 days** |

> Realistic solo developer estimate using Claude Code as your pair programmer.
> With AI assistance, these timelines are achievable. Without it, multiply by 1.5–2x.
