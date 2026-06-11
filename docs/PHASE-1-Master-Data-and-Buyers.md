# PHASE 1 — Master Data, Buyer Module & Product Catalog
**FHI Export Trade Calculator**
**Duration: 7–10 days**
**Goal: Buyers, Products, Suppliers, and all Master Data fully functional**

---

## 1.1 Overview

Phase 1 builds the **data foundation** — all the master tables and CRUD interfaces that the costing engine (Phase 2) depends on. No calculation logic yet, just clean data management.

By end of Phase 1 you will have:
- Buyer management (create, view, edit, list)
- Product catalog with full hierarchy
- Category-specific dynamic fields per module
- Supplier master
- Cost template master (freight, port charges, etc.)
- All dropdown/reference data seeded

---

## 1.2 Database Schema — Phase 1 Additions

Add these models to `prisma/schema.prisma`:

```prisma
// ─── Buyers ──────────────────────────────────────────────────

model Buyer {
  id              String        @id @default(cuid())
  name            String
  companyName     String
  email           String
  phone           String?
  address         String?
  country         String
  region          String?
  currency        Currency      @default(USD)
  buyerCategory   BuyerCategory
  portOfDest      String?
  notes           String?
  isActive        Boolean       @default(true)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  quotes          Quote[]
}

enum BuyerCategory {
  DISTRIBUTOR
  RETAILER
  HOSPITALITY
  IMPORTER
  WHOLESALER
  MARKETPLACE
  OEM_BUYER
}

enum Currency {
  INR
  AUD
  NZD
  JPY
  USD
  EUR
}

// ─── Products ────────────────────────────────────────────────

model ProductLine {
  id          String            @id @default(cuid())
  name        String            @unique   // e.g. "Textiles"
  code        String            @unique   // e.g. "TXT"
  isActive    Boolean           @default(true)
  categories  ProductCategory[]
}

model ProductCategory {
  id            String        @id @default(cuid())
  name          String                              // e.g. "Towels"
  code          String                              // e.g. "TWL"
  productLineId String
  productLine   ProductLine   @relation(fields: [productLineId], references: [id])
  types         ProductType[]
}

model ProductType {
  id          String          @id @default(cuid())
  name        String                                // e.g. "Bath Towel"
  code        String                                // e.g. "BTH"
  categoryId  String
  category    ProductCategory @relation(fields: [categoryId], references: [id])
  products    Product[]
}

model Product {
  id              String      @id @default(cuid())
  productCode     String      @unique             // e.g. TX-TWL-BTH-600GSM-WHT
  description     String
  productTypeId   String
  productType     ProductType @relation(fields: [productTypeId], references: [id])
  moq             Int?
  imageUrl        String?
  isActive        Boolean     @default(true)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Dynamic category-specific attributes stored as JSON
  attributes      Json?

  // Pricing reference
  baseSupplierCost Decimal?  @db.Decimal(12, 2)
  packagingDetails Json?

  quoteItems      QuoteItem[]
}

// ─── Suppliers ───────────────────────────────────────────────

model Supplier {
  id              String   @id @default(cuid())
  name            String
  contactPerson   String?
  email           String?
  phone           String?
  address         String?
  region          String?
  gstNumber       String?
  iecNumber       String?
  exportCapable   Boolean  @default(true)
  moq             Int?
  leadTimeDays    Int?
  certifications  String[] // ["ISO", "FSSAI", etc.]
  notes           String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// ─── Cost Templates (Master Rates) ───────────────────────────

model FreightTemplate {
  id              String   @id @default(cuid())
  name            String                          // e.g. "AUS Sea Freight Standard"
  originPort      String
  destinationPort String
  destinationCountry String
  freightCost20ft Decimal  @db.Decimal(12, 2)
  freightCost40ft Decimal  @db.Decimal(12, 2)
  transitDays     Int?
  validFrom       DateTime
  validTo         DateTime?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
}

model PortChargeTemplate {
  id              String   @id @default(cuid())
  portName        String
  chaCharges      Decimal  @db.Decimal(12, 2)
  portCharges     Decimal  @db.Decimal(12, 2)
  handlingCharges Decimal  @db.Decimal(12, 2)
  documentCharges Decimal  @db.Decimal(12, 2)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
}

model CurrencyRate {
  id           String   @id @default(cuid())
  fromCurrency Currency
  toCurrency   Currency
  rate         Decimal  @db.Decimal(12, 6)
  source       String   @default("MANUAL")     // MANUAL | LIVE
  lockedDate   DateTime @default(now())
  createdAt    DateTime @default(now())
}
```

---

## 1.3 Backend — Module Structure

Each module follows this pattern:

```
modules/
├── buyers/
│   ├── buyer.routes.ts
│   ├── buyer.controller.ts
│   ├── buyer.service.ts
│   └── buyer.schema.ts          ← Zod validation schemas
├── products/
│   ├── product.routes.ts
│   ├── product.controller.ts
│   ├── product.service.ts
│   └── product.schema.ts
├── suppliers/
│   ├── supplier.routes.ts
│   ├── supplier.controller.ts
│   ├── supplier.service.ts
│   └── supplier.schema.ts
└── master-data/
    ├── master.routes.ts          ← Currencies, freight templates, port charges
    ├── master.controller.ts
    └── master.service.ts
```

---

## 1.4 API Endpoints — Phase 1

### Buyers API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/buyers` | Create buyer |
| GET | `/api/buyers` | List all buyers (paginated) |
| GET | `/api/buyers/:id` | Get buyer details |
| PUT | `/api/buyers/:id` | Update buyer |
| DELETE | `/api/buyers/:id` | Soft delete buyer |
| GET | `/api/buyers/:id/quotes` | Get buyer's quote history |

### Products API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products/lines` | Get all product lines |
| GET | `/api/products/lines/:lineId/categories` | Get categories for a line |
| GET | `/api/products/categories/:categoryId/types` | Get types for a category |
| GET | `/api/products/types/:typeId/products` | Get products for a type |
| POST | `/api/products` | Create product |
| GET | `/api/products` | List all products (with filters) |
| GET | `/api/products/:id` | Get product detail |
| PUT | `/api/products/:id` | Update product |
| GET | `/api/products/search?q=` | Search products |

### Suppliers API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/suppliers` | Create supplier |
| GET | `/api/suppliers` | List suppliers |
| GET | `/api/suppliers/:id` | Get supplier |
| PUT | `/api/suppliers/:id` | Update supplier |

### Master Data API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/master/currencies` | Get currency rates |
| POST | `/api/master/currencies` | Add/update rate |
| GET | `/api/master/freight-templates` | Get freight templates |
| POST | `/api/master/freight-templates` | Add freight template |
| GET | `/api/master/port-charges` | Get port charge templates |
| POST | `/api/master/port-charges` | Add port charge template |
| GET | `/api/master/incoterms` | Get incoterm list |
| GET | `/api/master/ports` | Get port list |

---

## 1.5 Zod Validation Schemas

`modules/buyers/buyer.schema.ts`:
```typescript
import { z } from 'zod';

export const createBuyerSchema = z.object({
  name: z.string().min(1, 'Buyer name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  region: z.string().optional(),
  currency: z.enum(['INR', 'AUD', 'NZD', 'JPY', 'USD', 'EUR']),
  buyerCategory: z.enum([
    'DISTRIBUTOR', 'RETAILER', 'HOSPITALITY',
    'IMPORTER', 'WHOLESALER', 'MARKETPLACE', 'OEM_BUYER'
  ]),
  portOfDest: z.string().optional(),
  notes: z.string().optional(),
});

export const updateBuyerSchema = createBuyerSchema.partial();

export type CreateBuyerInput = z.infer<typeof createBuyerSchema>;
export type UpdateBuyerInput = z.infer<typeof updateBuyerSchema>;
```

---

## 1.6 Category-Specific Attributes Design

The `attributes` JSON field on the `Product` model stores category-specific data. Each category module defines its own Zod schema for this JSON.

### Textile Attributes Schema
```typescript
export const textileAttributesSchema = z.object({
  material: z.string(),           // "Cotton"
  gsm: z.number(),                // 400 / 600
  size: z.string(),               // "70x140 cm"
  color: z.string(),
  weaveType: z.string().optional(),
  stitchingType: z.string().optional(),
  brandLabelRequired: z.boolean().default(false),
  packagingType: z.string(),
  unitsPerCarton: z.number(),
  moq: z.number(),
  privateLabel: z.boolean().default(false),
});
```

### Spice Attributes Schema
```typescript
export const spiceAttributesSchema = z.object({
  spiceType: z.string(),
  grade: z.string(),
  originState: z.string(),
  shelfLifeMonths: z.number(),
  packagingType: z.string(),
  fssaiRequired: z.boolean().default(true),
  labTesting: z.boolean().default(false),
  moistureLevel: z.number().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
});
```

### Handicraft Attributes Schema
```typescript
export const handicraftAttributesSchema = z.object({
  materialType: z.string(),       // "Brass"
  finish: z.string(),             // "Matte Gold"
  isHandmade: z.boolean(),
  isFrag: z.boolean().default(false),
  exportPackagingType: z.string(),
  productWeightKg: z.number(),
  cartonVolumeCbm: z.number().optional(),
  designSku: z.string().optional(),
  moq: z.number(),
});
```

> Store these schemas in `shared/schemas/product-attributes/` so both frontend and backend can import them.

---

## 1.7 Seed Data

`prisma/seed.ts` — seed critical reference data:

```typescript
const productLines = [
  { name: 'Textiles', code: 'TXT' },
  { name: 'Handicrafts & Home Decor', code: 'HND' },
  { name: 'Carpets & Rugs', code: 'CAR' },
  { name: 'Stationery', code: 'STA' },
  { name: 'Spices', code: 'SPC' },
  { name: 'Cotton Bags', code: 'CTB' },
];

const incoterms = ['EXW', 'FOB', 'CIF', 'CFR', 'DDP'];

const ports = [
  { name: 'Nhava Sheva (JNPT)', country: 'India', type: 'ORIGIN' },
  { name: 'Chennai Port', country: 'India', type: 'ORIGIN' },
  { name: 'Port of Melbourne', country: 'Australia', type: 'DESTINATION' },
  { name: 'Port of Sydney', country: 'Australia', type: 'DESTINATION' },
  { name: 'Port of Auckland', country: 'New Zealand', type: 'DESTINATION' },
  { name: 'Port of Yokohama', country: 'Japan', type: 'DESTINATION' },
];

// Seed currency rates (manual baseline)
const currencyRates = [
  { from: 'INR', to: 'AUD', rate: 0.018 },
  { from: 'INR', to: 'USD', rate: 0.012 },
  { from: 'INR', to: 'NZD', rate: 0.020 },
  { from: 'INR', to: 'JPY', rate: 1.83 },
];
```

Run seed: `npx prisma db seed`

---

## 1.8 Frontend — Pages & Components

### Pages to Build

```
app/
├── buyers/
│   ├── page.tsx              # Buyer list table
│   ├── new/page.tsx          # Create buyer form
│   └── [id]/
│       ├── page.tsx          # Buyer profile + quote history
│       └── edit/page.tsx     # Edit buyer
├── products/
│   ├── page.tsx              # Product catalog (with filters)
│   ├── new/page.tsx          # Create product (dynamic form)
│   └── [id]/page.tsx         # Product detail
├── suppliers/
│   ├── page.tsx              # Supplier list
│   └── new/page.tsx          # Create supplier
└── settings/
    └── master-data/page.tsx  # Freight templates, port charges, currency rates
```

### Key Components

#### 1. BuyerForm Component
- All buyer fields as controlled inputs
- Country dropdown (use a countries list constant)
- Currency dropdown
- Incoterm dropdown
- React Hook Form + Zod validation
- Submit → POST `/api/buyers`

#### 2. ProductForm Component (Most Complex in Phase 1)
- Step 1: Select Product Line → Product Category → Product Type
- Step 2: Enter product code, description, base cost, MOQ
- Step 3: Dynamic attribute fields based on selected category
- Uses a `CategoryAttributeFields` component that renders different fields based on `productLine`

```typescript
// components/products/CategoryAttributeFields.tsx
interface Props {
  productLine: string;
  control: Control;  // React Hook Form control
}

export function CategoryAttributeFields({ productLine, control }: Props) {
  switch (productLine) {
    case 'TXT': return <TextileFields control={control} />;
    case 'SPC': return <SpiceFields control={control} />;
    case 'HND': return <HandicraftFields control={control} />;
    case 'CAR': return <CarpetFields control={control} />;
    case 'STA': return <StationeryFields control={control} />;
    case 'CTB': return <CottonBagFields control={control} />;
    default: return null;
  }
}
```

#### 3. DataTable Component (Reusable)
Use shadcn/ui `Table` component. Build a reusable `DataTable` with:
- Column definitions
- Pagination
- Search/filter bar
- Row actions (edit, delete, view)

This same component is reused for Buyers, Products, Suppliers, Quotes.

---

## 1.9 Frontend — State Management

Use Zustand for global state. Create these stores:

```typescript
// store/master-data.store.ts
interface MasterDataStore {
  productLines: ProductLine[];
  currencies: CurrencyRate[];
  freightTemplates: FreightTemplate[];
  fetchProductLines: () => Promise<void>;
  fetchCurrencies: () => Promise<void>;
}
```

Fetch master data once on app load (in the dashboard layout) and store in Zustand. This avoids repeated API calls when building quote forms later.

---

## 1.10 Phase 1 Completion Checklist

### Backend
- [ ] Prisma schema migrated with all Phase 1 tables
- [ ] Buyers CRUD API complete and tested
- [ ] Products API with hierarchy (line → category → type → product)
- [ ] Dynamic attributes stored and retrieved correctly
- [ ] Suppliers CRUD API complete
- [ ] Master data API (freight, port charges, currencies) complete
- [ ] Zod validation on all endpoints
- [ ] Auth middleware protecting all routes
- [ ] Seed data loaded (product lines, ports, incoterms, rates)

### Frontend
- [ ] Buyer list page with search and pagination
- [ ] Create / Edit buyer form working
- [ ] Buyer detail page showing info + empty quote history
- [ ] Product catalog page with filters by line/category
- [ ] Create product form with dynamic category fields
- [ ] Product detail page
- [ ] Supplier list and create form
- [ ] Master data settings page (view/add freight templates, port charges, currency rates)
- [ ] Reusable DataTable component built

### Quality
- [ ] All forms have validation error messages
- [ ] Loading states on all data fetches
- [ ] Empty states on all list pages
- [ ] Mobile responsive layouts

---

## 1.11 Claude Code Prompts for This Phase

**For Prisma Schema:**
> "Add the Buyer, Product, ProductLine, ProductCategory, ProductType, Supplier, FreightTemplate, PortChargeTemplate, and CurrencyRate models to our Prisma schema for the FHI Export platform. Here is the current schema: [paste]. Follow these field specs: [paste section 1.2]"

**For CRUD Module:**
> "Build the buyers module for our Express backend. Structure: routes → controller → service. Use Prisma client. Validate with Zod using this schema: [paste]. Follow RESTful conventions. Include error handling."

**For Dynamic Product Form:**
> "Build a React product creation form using React Hook Form and Zod. It should have 3 steps: (1) Product hierarchy selection, (2) Basic product details, (3) Dynamic category-specific fields. The category fields component switches based on selected product line. Here are the category schemas: [paste]"
