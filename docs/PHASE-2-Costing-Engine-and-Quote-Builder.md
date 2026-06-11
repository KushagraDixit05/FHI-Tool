# PHASE 2 — Costing Engine & Quote Builder
**FHI Export Trade Calculator**
**Duration: 10–14 days**
**Goal: Full costing calculation, quote creation, and quote management**

---

## 2.1 Overview

This is the **core phase** — the heart of the entire platform. Everything built in Phase 0 and 1 feeds into this. By end of Phase 2:

- The costing engine calculates export costs end-to-end
- Quotes can be created, saved, edited, and tracked
- Incoterm-aware cost inclusion/exclusion works
- Multi-currency conversion is applied
- Margin and profitability are calculated and displayed
- Quote CRM pipeline (Draft → Approved → PO Received) is functional
- Quote IDs are auto-generated in FHI format

---

## 2.2 Database Schema — Phase 2 Additions

```prisma
// ─── Quotes ──────────────────────────────────────────────────

model Quote {
  id              String      @id @default(cuid())
  quoteNumber     String      @unique           // e.g. FHI-TXT-AUS-00021
  status          QuoteStatus @default(DRAFT)
  incoterm        Incoterm
  buyerId         String
  buyer           Buyer       @relation(fields: [buyerId], references: [id])
  createdById     String
  createdBy       User        @relation(fields: [createdById], references: [id])
  currency        Currency
  exchangeRate    Decimal     @db.Decimal(12, 6)  // INR → buyer currency rate locked at creation
  fxBuffer        Decimal     @db.Decimal(5, 2)   // e.g. 2.5 (%)
  notes           String?
  internalNotes   String?
  validUntil      DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  items           QuoteItem[]
  costs           QuoteCost[]
  statusHistory   QuoteStatusHistory[]
  documents       QuoteDocument[]
}

enum QuoteStatus {
  DRAFT
  UNDER_REVIEW
  SENT_TO_BUYER
  NEGOTIATION
  APPROVED
  PO_RECEIVED
  SHIPMENT_PLANNED
  CLOSED
  LOST
}

enum Incoterm {
  EXW
  FOB
  CIF
  CFR
  DDP
}

// ─── Quote Line Items ─────────────────────────────────────────

model QuoteItem {
  id                  String   @id @default(cuid())
  quoteId             String
  quote               Quote    @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  productId           String
  product             Product  @relation(fields: [productId], references: [id])
  quantity            Int
  unitSupplierCost    Decimal  @db.Decimal(12, 2)    // INR
  packagingCostPerUnit Decimal @db.Decimal(12, 2)    // INR
  labelingCostPerUnit Decimal  @db.Decimal(12, 2)    // INR
  qcCostPerUnit       Decimal  @db.Decimal(12, 2)    // INR
  samplingCost        Decimal  @db.Decimal(12, 2)    // one-time, INR
  toolingCost         Decimal  @db.Decimal(12, 2)    // one-time, INR
  marginPercent       Decimal  @db.Decimal(5, 2)     // e.g. 15.00
  totalProductCostInr Decimal  @db.Decimal(14, 2)    // calculated
  unitSellingPrice    Decimal  @db.Decimal(12, 4)    // in buyer currency
  totalLineValue      Decimal  @db.Decimal(14, 4)    // in buyer currency

  // Container/packaging
  unitsPerCarton      Int?
  cartonsPerPallet    Int?
  cartonLWHCm         Json?                           // { l, w, h }
  cartonWeightKg      Decimal? @db.Decimal(8, 2)
  totalCbm            Decimal? @db.Decimal(10, 4)    // calculated
  totalWeightKg       Decimal? @db.Decimal(10, 2)    // calculated
}

// ─── Quote Cost Breakdown ─────────────────────────────────────

model QuoteCost {
  id          String      @id @default(cuid())
  quoteId     String
  quote       Quote       @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  category    CostCategory
  label       String                              // e.g. "Sea Freight 20ft"
  amount      Decimal     @db.Decimal(12, 2)     // INR
  isIncluded  Boolean     @default(true)
  isOptional  Boolean     @default(false)
  notes       String?
}

enum CostCategory {
  PRODUCT
  LOGISTICS
  OPERATIONAL
  MARGIN
}

// ─── Quote Status History (CRM) ───────────────────────────────

model QuoteStatusHistory {
  id        String      @id @default(cuid())
  quoteId   String
  quote     Quote       @relation(fields: [quoteId], references: [id])
  fromStatus QuoteStatus?
  toStatus  QuoteStatus
  changedAt DateTime    @default(now())
  changedById String
  note      String?
}

// ─── Quote Documents ─────────────────────────────────────────

model QuoteDocument {
  id        String   @id @default(cuid())
  quoteId   String
  quote     Quote    @relation(fields: [quoteId], references: [id])
  type      DocType
  url       String
  createdAt DateTime @default(now())
}

enum DocType {
  QUOTATION_PDF
  PROFORMA_INVOICE
  PRODUCT_SPEC_SHEET
  PACKING_SUMMARY
  INTERNAL_COSTING
  MARGIN_ANALYSIS
}
```

---

## 2.3 The Costing Engine — Core Logic

This is the most important part of the platform. Build it as a **pure calculation service** — no DB calls, just math. This makes it testable and reusable.

`backend/src/modules/costing/costing.engine.ts`:

### Input Interface

```typescript
export interface CostingInput {
  // Product
  quantity: number;
  unitSupplierCost: number;           // INR per unit
  packagingCostPerUnit: number;       // INR
  labelingCostPerUnit: number;        // INR
  qcCostPerUnit: number;              // INR
  samplingCost: number;               // one-time INR
  toolingCost: number;                // one-time INR

  // Logistics (all INR)
  inlandTransport: number;
  freightCost: number;
  chaCharges: number;
  portCharges: number;
  customsClearance: number;
  documentCharges: number;
  palletization: number;
  fumigation: number;
  warehousing: number;
  insurance: number;
  containerCost: number;
  handlingCharges: number;
  exportDuty: number;
  inspectionCharges: number;

  // Operational (all INR)
  bankCharges: number;
  currencyConversionBuffer: number;
  platformAdminCost: number;
  travelCostAllocation: number;
  communicationCost: number;
  agentCommission: number;
  miscBuffer: number;

  // Margin
  marginPercent: number;
  riskBufferPercent: number;          // e.g. 3% contingency

  // Currency
  exchangeRate: number;               // INR to buyer currency
  fxBufferPercent: number;

  // Incoterm
  incoterm: 'EXW' | 'FOB' | 'CIF' | 'CFR' | 'DDP';
}
```

### Output Interface

```typescript
export interface CostingResult {
  // Per unit breakdown (INR)
  unitProductCost: number;
  unitLogisticsCost: number;
  unitOperationalCost: number;
  unitTotalCostBeforeMargin: number;
  unitMarginAmount: number;
  unitSellingPriceInr: number;
  unitSellingPriceForeign: number;   // in buyer currency

  // Total (INR)
  totalProductCost: number;
  totalLogisticsCost: number;
  totalOperationalCost: number;
  totalCostBeforeMargin: number;
  totalMarginAmount: number;
  totalSellingPriceInr: number;
  totalSellingPriceForeign: number;

  // Profitability
  netProfit: number;                 // INR
  profitPerUnit: number;             // INR
  profitabilityScore: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'LOW' | 'CRITICAL';
  effectiveMarginPercent: number;

  // Incoterm-filtered cost list
  includedCosts: { label: string; amount: number; category: string }[];
  excludedCosts: { label: string; amount: number; reason: string }[];
}
```

### Incoterm Logic

```typescript
const INCOTERM_INCLUSIONS = {
  EXW: {
    includes: ['PRODUCT'],
    excludes: ['inland', 'freight', 'cha', 'port', 'customs', 'insurance', 'destination']
  },
  FOB: {
    includes: ['PRODUCT', 'inland', 'cha', 'port', 'customs', 'export_duty'],
    excludes: ['freight', 'insurance', 'destination']
  },
  CFR: {
    includes: ['PRODUCT', 'inland', 'cha', 'port', 'customs', 'freight'],
    excludes: ['insurance', 'destination']
  },
  CIF: {
    includes: ['PRODUCT', 'inland', 'cha', 'port', 'customs', 'freight', 'insurance'],
    excludes: ['destination']
  },
  DDP: {
    includes: ['ALL'],  // everything
    excludes: []
  }
};
```

### Calculation Steps

```typescript
export function calculateCosting(input: CostingInput): CostingResult {

  // Step 1: Total product cost (per unit basis)
  const productCostPerUnit =
    input.unitSupplierCost +
    input.packagingCostPerUnit +
    input.labelingCostPerUnit +
    input.qcCostPerUnit +
    (input.samplingCost + input.toolingCost) / input.quantity;  // amortize one-time costs

  const totalProductCost = productCostPerUnit * input.quantity;

  // Step 2: Filter logistics costs by incoterm
  const allLogisticsCosts = {
    inland: input.inlandTransport,
    freight: input.freightCost,
    cha: input.chaCharges,
    port: input.portCharges,
    customs: input.customsClearance,
    documents: input.documentCharges,
    palletization: input.palletization,
    fumigation: input.fumigation,
    warehousing: input.warehousing,
    insurance: input.insurance,
    container: input.containerCost,
    handling: input.handlingCharges,
    export_duty: input.exportDuty,
    inspection: input.inspectionCharges,
  };

  const inclusions = INCOTERM_INCLUSIONS[input.incoterm];
  const filteredLogisticsCost = Object.entries(allLogisticsCosts)
    .filter(([key]) => inclusions.includes === 'ALL' || inclusions.includes.includes(key))
    .reduce((sum, [, val]) => sum + val, 0);

  // Step 3: Operational costs
  const totalOperationalCost =
    input.bankCharges +
    input.currencyConversionBuffer +
    input.platformAdminCost +
    input.travelCostAllocation +
    input.communicationCost +
    input.agentCommission +
    input.miscBuffer;

  // Step 4: Total cost before margin
  const totalCostBeforeMargin = totalProductCost + filteredLogisticsCost + totalOperationalCost;

  // Step 5: Apply margin + risk buffer
  const combinedMargin = input.marginPercent + input.riskBufferPercent;
  const totalMarginAmount = (totalCostBeforeMargin * combinedMargin) / 100;
  const totalSellingPriceInr = totalCostBeforeMargin + totalMarginAmount;

  // Step 6: Apply FX buffer and convert
  const effectiveRate = input.exchangeRate * (1 - input.fxBufferPercent / 100);
  const totalSellingPriceForeign = totalSellingPriceInr / effectiveRate;

  // Step 7: Per unit calculations
  const unitSellingPriceForeign = totalSellingPriceForeign / input.quantity;

  // Step 8: Profitability score
  const profitabilityScore = scoreProfitability(input.marginPercent);

  return {
    totalProductCost,
    totalLogisticsCost: filteredLogisticsCost,
    totalOperationalCost,
    totalCostBeforeMargin,
    totalMarginAmount,
    totalSellingPriceInr,
    totalSellingPriceForeign,
    unitSellingPriceForeign,
    unitSellingPriceInr: totalSellingPriceInr / input.quantity,
    unitProductCost: productCostPerUnit,
    unitLogisticsCost: filteredLogisticsCost / input.quantity,
    unitOperationalCost: totalOperationalCost / input.quantity,
    unitTotalCostBeforeMargin: totalCostBeforeMargin / input.quantity,
    unitMarginAmount: totalMarginAmount / input.quantity,
    netProfit: totalMarginAmount,
    profitPerUnit: totalMarginAmount / input.quantity,
    profitabilityScore,
    effectiveMarginPercent: combinedMargin,
    includedCosts: [], // build from filtered costs
    excludedCosts: [], // build from excluded costs
  };
}

function scoreProfitability(margin: number): CostingResult['profitabilityScore'] {
  if (margin >= 25) return 'EXCELLENT';
  if (margin >= 18) return 'GOOD';
  if (margin >= 12) return 'ACCEPTABLE';
  if (margin >= 8)  return 'LOW';
  return 'CRITICAL';
}
```

---

## 2.4 Quote Number Generation

`backend/src/modules/quotes/quote-number.service.ts`:

```typescript
// Format: FHI-{CATEGORY_CODE}-{COUNTRY_CODE}-{YEAR}-{SEQUENCE}
// Example: FHI-TXT-AUS-2026-00021

export async function generateQuoteNumber(
  categoryCode: string,
  countryCode: string,
  prisma: PrismaClient
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FHI-${categoryCode}-${countryCode}-${year}`;

  // Count existing quotes with this prefix
  const count = await prisma.quote.count({
    where: { quoteNumber: { startsWith: prefix } }
  });

  const sequence = String(count + 1).padStart(5, '0');
  return `${prefix}-${sequence}`;
}
```

---

## 2.5 API Endpoints — Phase 2

### Quotes API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/quotes` | Create new quote (draft) |
| GET | `/api/quotes` | List quotes (with filters: status, buyer, date range) |
| GET | `/api/quotes/:id` | Get full quote with all costs |
| PUT | `/api/quotes/:id` | Update quote |
| PATCH | `/api/quotes/:id/status` | Update quote status (CRM pipeline) |
| DELETE | `/api/quotes/:id` | Delete draft quote |
| POST | `/api/quotes/:id/duplicate` | Duplicate a quote |
| GET | `/api/quotes/:id/export` | Export quote as PDF |

### Costing API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/costing/calculate` | Run costing engine (no save) — used for live preview |
| POST | `/api/costing/recommend-margin` | Get recommended margin for product category |
| GET | `/api/costing/incoterm-costs/:incoterm` | Get which costs are included for an incoterm |

---

## 2.6 Frontend — Quote Builder (Multi-Step Form)

The quote builder is the most complex UI in the app. Use a **multi-step wizard**.

### Step Structure

```
Step 1: Buyer Selection
  └── Search/select existing buyer OR create new buyer inline

Step 2: Quote Settings
  └── Incoterm, currency, FX buffer %, valid until date

Step 3: Product Line Items
  └── Add one or more products
  └── For each: quantity, supplier cost, packaging cost, QC cost, margin %
  └── Live unit price preview as user types

Step 4: Export Costs (Logistics)
  └── Auto-populate from freight template if buyer country matches
  └── Editable fields for all logistics costs
  └── Incoterm filter shows/hides relevant fields

Step 5: Operational Costs
  └── Bank charges, agent commission, misc buffer, etc.

Step 6: Review & Summary
  └── Full cost breakdown table
  └── Margin analysis
  └── Profitability score
  └── Save as Draft OR Save & Send

```

### Live Calculation Preview

As the user fills in costs, call `/api/costing/calculate` on debounce (300ms) and show a live sidebar panel with:
- Unit cost breakdown
- Unit selling price in buyer currency
- Margin amount
- Profitability score indicator (color-coded badge)

```typescript
// hooks/useCosting.ts
export function useCosting(input: Partial<CostingInput>) {
  const [result, setResult] = useState<CostingResult | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = useDebouncedCallback(async (data: CostingInput) => {
    if (!isComplete(data)) return;
    setLoading(true);
    const res = await api.post('/costing/calculate', data);
    setResult(res.data);
    setLoading(false);
  }, 300);

  useEffect(() => {
    calculate(input as CostingInput);
  }, [input]);

  return { result, loading };
}
```

### Smart Alerts Panel

Show inline warnings during quote creation:

```typescript
interface Alert {
  type: 'warning' | 'error' | 'info';
  message: string;
}

function getQuoteAlerts(input: CostingInput, result: CostingResult): Alert[] {
  const alerts: Alert[] = [];

  if (result.effectiveMarginPercent < 10) {
    alerts.push({ type: 'error', message: '⚠ Margin is critically low (below 10%)' });
  }

  if (input.quantity < (product.moq ?? 0)) {
    alerts.push({ type: 'warning', message: `Quantity below supplier MOQ of ${product.moq}` });
  }

  if (input.fxBufferPercent < 2) {
    alerts.push({ type: 'info', message: 'Consider adding at least 2% FX buffer for currency protection' });
  }

  return alerts;
}
```

---

## 2.7 Quote Summary Page

After creation, the quote detail page shows:

### Sections
1. **Quote Header** — Quote number, status badge, buyer info, incoterm, currency
2. **Product Line Items** — Table of products with qty, unit cost, unit price
3. **Cost Breakdown** — Accordion with Product / Logistics / Operational costs
4. **Profitability Panel** — Margin %, net profit, profit per unit, score badge
5. **CRM Timeline** — Status history log
6. **Actions Bar** — Edit | Change Status | Generate PDF | Duplicate

### Status Change Flow

```typescript
// Simple dropdown + confirm modal
const STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT: ['UNDER_REVIEW', 'LOST'],
  UNDER_REVIEW: ['SENT_TO_BUYER', 'DRAFT', 'LOST'],
  SENT_TO_BUYER: ['NEGOTIATION', 'APPROVED', 'LOST'],
  NEGOTIATION: ['APPROVED', 'LOST'],
  APPROVED: ['PO_RECEIVED', 'LOST'],
  PO_RECEIVED: ['SHIPMENT_PLANNED'],
  SHIPMENT_PLANNED: ['CLOSED'],
  CLOSED: [],
  LOST: ['DRAFT'],  // allow reactivation
};
```

---

## 2.8 Quotes List & CRM Dashboard

`app/quotes/page.tsx`:

### Filters
- Status (multi-select)
- Buyer country
- Product category
- Date range
- Created by

### Quote Cards / Table View

Toggle between:
- **Table View**: Quote number, buyer, total value, margin %, status, date
- **Kanban View** (optional, Phase 3): Columns per status

### Stats Bar (top of page)
```
Active Quotes: 12    |    Total Pipeline Value: AUD 48,500    |    Avg Margin: 18.2%    |    Won This Month: 3
```

---

## 2.9 Auto-Populate from Templates

When user selects a buyer country + incoterm in Step 2, automatically pull freight template data:

```typescript
// On buyer country + incoterm selection:
const template = await api.get('/master/freight-templates', {
  params: { destinationCountry: buyer.country, incoterm }
});

if (template) {
  // Auto-fill freight cost, CHA charges, port charges
  setValue('freightCost', template.freightCost20ft);  // or 40ft
  setValue('chaCharges', template.portData.chaCharges);
  setValue('portCharges', template.portData.portCharges);
}
```

---

## 2.10 Container Intelligence

In Step 3 (product line items), add a container calculator panel:

```typescript
interface ContainerCalc {
  unitsPerCarton: number;
  cartonL: number;  // cm
  cartonW: number;
  cartonH: number;
  cartonWeight: number;  // kg
  quantity: number;
}

function calculateContainerNeeds(calc: ContainerCalc) {
  const totalCartons = Math.ceil(calc.quantity / calc.unitsPerCarton);
  const cartonCbm = (calc.cartonL * calc.cartonW * calc.cartonH) / 1_000_000;
  const totalCbm = cartonCbm * totalCartons;
  const totalWeightKg = calc.cartonWeight * totalCartons;

  // 20ft container = ~25-28 CBM, ~21,700 kg payload
  // 40ft container = ~55-58 CBM, ~26,700 kg payload
  const containers20ft = Math.ceil(totalCbm / 26);
  const containers40ft = Math.ceil(totalCbm / 56);

  return { totalCartons, totalCbm, totalWeightKg, containers20ft, containers40ft };
}
```

Show the result as a visual indicator: "Estimated: 1 × 20ft container (72% utilized)"

---

## 2.11 Phase 2 Completion Checklist

### Backend
- [ ] Quote, QuoteItem, QuoteCost, QuoteStatusHistory, QuoteDocument tables migrated
- [ ] Costing engine (`costing.engine.ts`) built and unit tested
- [ ] Incoterm cost filtering working correctly for all 5 incoterms
- [ ] Quote CRUD API complete
- [ ] Quote number auto-generation working
- [ ] Status transition API with history logging
- [ ] `/api/costing/calculate` endpoint working
- [ ] Auto-populate from freight templates
- [ ] Quote duplication working

### Frontend
- [ ] Multi-step quote builder (6 steps) working
- [ ] Live costing preview panel updating as user types
- [ ] Smart alerts (low margin, MOQ warning, FX warning) showing
- [ ] Freight template auto-population working
- [ ] Container calculator panel working
- [ ] Quote detail page with all sections
- [ ] Status change with dropdown + confirm modal
- [ ] CRM status history timeline showing
- [ ] Quotes list with filters and search
- [ ] Stats bar on quotes page
- [ ] Quote duplication working

### Quality
- [ ] Costing calculations tested against manual spreadsheet
- [ ] All 5 incoterms produce correct cost inclusions
- [ ] Multi-currency display (show INR internally, buyer currency on output)
- [ ] Decimal precision consistent (2dp for INR, 4dp for foreign)

---

## 2.12 Claude Code Prompts for This Phase

**For Costing Engine:**
> "Build a pure TypeScript costing engine for an export trade calculator. No DB calls — pure calculation. Here is the input interface, output interface, and incoterm logic: [paste]. Include all calculation steps as comments. Write unit tests for EXW, FOB, CIF, CFR, DDP."

**For Multi-Step Quote Form:**
> "Build a 6-step quote builder wizard in Next.js using React Hook Form and Zod. Each step has its own schema. The form state is shared across steps using a parent form context. Step 3 calls the costing API on debounce to show a live preview. Here is the step structure: [paste]"

**For Quote Status Machine:**
> "Build a quote status management system. There are 9 statuses with defined valid transitions. The UI shows a dropdown with only valid next statuses. On change, it calls PATCH /api/quotes/:id/status, logs the history, and updates the UI. Use this transitions map: [paste]"
