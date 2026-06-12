// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'TRADE_MANAGER' | 'SALES' | 'FINANCE' | 'OPERATIONS';

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Buyers ───────────────────────────────────────────────────────────────────

export type BuyerCategory =
  | 'DISTRIBUTOR'
  | 'RETAILER'
  | 'HOSPITALITY'
  | 'IMPORTER'
  | 'WHOLESALER'
  | 'MARKETPLACE'
  | 'OEM_BUYER';

export type Currency = 'INR' | 'AUD' | 'NZD' | 'JPY' | 'USD' | 'EUR';

export interface Buyer {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  country: string;
  region?: string | null;
  currency: Currency;
  buyerCategory: BuyerCategory;
  portOfDest?: string | null;
  productInterests: string[];
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { quotes: number };
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface ProductLine {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  _count?: { categories: number };
}

export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  productLineId: string;
  productLine?: ProductLine;
  _count?: { types: number };
}

export interface ProductType {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  category?: ProductCategory;
  _count?: { products: number };
}

export interface Product {
  id: string;
  productCode: string;
  description: string;
  specifications?: string | null;
  productTypeId: string;
  productType?: ProductType & { category?: ProductCategory & { productLine?: ProductLine } };
  moq?: number | null;
  imageUrl?: string | null;
  isActive: boolean;
  hsCode?: string | null;
  exportDutyRate?: number | null;
  packagingType?: string | null;
  unitsPerCarton?: number | null;
  cartonWeightKg?: number | null;
  leadTimeDays?: number | null;
  categoryAttributes?: Record<string, unknown> | null;
  attributes?: Record<string, unknown> | null;
  baseSupplierCost?: number | null;
  packagingDetails?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  region?: string | null;
  gstNumber?: string | null;
  iecNumber?: string | null;
  exportCapable: boolean;
  moq?: number | null;
  leadTimeDays?: number | null;
  certifications: string[];
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Master Data ──────────────────────────────────────────────────────────────

export interface CurrencyRate {
  id: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  source: string;
  lockedDate: string;
  createdAt: string;
}

export interface FreightTemplate {
  id: string;
  name: string;
  originPort: string;
  destinationPort: string;
  destinationCountry: string;
  freightCost20ft: number;
  freightCost40ft: number;
  transitDays?: number | null;
  validFrom: string;
  validTo?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PortChargeTemplate {
  id: string;
  portName: string;
  chaCharges: number;
  portCharges: number;
  handlingCharges: number;
  documentCharges: number;
  isActive: boolean;
  createdAt: string;
}

// ─── Quotes ───────────────────────────────────────────────────────────────────

export type Incoterm = 'EXW' | 'FOB' | 'CIF' | 'CFR' | 'DDP';

export type QuoteStatus =
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'SENT_TO_BUYER'
  | 'NEGOTIATION'
  | 'APPROVED'
  | 'PO_RECEIVED'
  | 'SHIPMENT_PLANNED'
  | 'CLOSED'
  | 'LOST';

export type CostCategory = 'PRODUCT' | 'LOGISTICS' | 'OPERATIONAL' | 'MARGIN';

export type DocType =
  | 'QUOTATION_PDF'
  | 'PROFORMA_INVOICE'
  | 'PRODUCT_SPEC_SHEET'
  | 'PACKING_SUMMARY'
  | 'INTERNAL_COSTING'
  | 'MARGIN_ANALYSIS';

export interface QuoteItem {
  id: string;
  quoteId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitSupplierCost: number;
  packagingCostPerUnit: number;
  labelingCostPerUnit: number;
  qcCostPerUnit: number;
  samplingCost: number;
  toolingCost: number;
  marginPercent: number;
  totalProductCostInr: number;
  unitSellingPrice: number;
  totalLineValue: number;
  unitsPerCarton?: number | null;
  cartonsPerPallet?: number | null;
  cartonLWHCm?: { l: number; w: number; h: number } | null;
  cartonWeightKg?: number | null;
  totalCbm?: number | null;
  totalWeightKg?: number | null;
}

export interface QuoteCost {
  id: string;
  quoteId: string;
  category: CostCategory;
  label: string;
  amount: number;
  isIncluded: boolean;
  isOptional: boolean;
  notes?: string | null;
}

export interface QuoteStatusHistory {
  id: string;
  quoteId: string;
  fromStatus?: QuoteStatus | null;
  toStatus: QuoteStatus;
  changedAt: string;
  changedById: string;
  changedBy?: Pick<User, 'id' | 'name'>;
  note?: string | null;
}

export interface QuoteDocument {
  id: string;
  quoteId: string;
  type: DocType;
  url: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  incoterm: Incoterm;
  buyerId: string;
  buyer?: Buyer;
  createdById: string;
  createdBy?: Pick<User, 'id' | 'name'>;
  currency: Currency;
  exchangeRate: number;
  fxBuffer: number;
  notes?: string | null;
  internalNotes?: string | null;
  validUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: QuoteItem[];
  costs?: QuoteCost[];
  statusHistory?: QuoteStatusHistory[];
  documents?: QuoteDocument[];
}

// ─── Costing Engine ───────────────────────────────────────────────────────────

export interface CostingInput {
  quantity: number;
  unitSupplierCost: number;
  packagingCostPerUnit: number;
  labelingCostPerUnit: number;
  qcCostPerUnit: number;
  samplingCost: number;
  toolingCost: number;
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
  bankCharges: number;
  currencyConversionBuffer: number;
  platformAdminCost: number;
  travelCostAllocation: number;
  communicationCost: number;
  agentCommission: number;
  miscBuffer: number;
  marginPercent: number;
  riskBufferPercent: number;
  exchangeRate: number;
  fxBufferPercent: number;
  incoterm: Incoterm;
}

export type ProfitabilityScore = 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'LOW' | 'CRITICAL';

export interface CostingResult {
  unitProductCost: number;
  unitLogisticsCost: number;
  unitOperationalCost: number;
  unitTotalCostBeforeMargin: number;
  unitMarginAmount: number;
  unitSellingPriceInr: number;
  unitSellingPriceForeign: number;
  totalProductCost: number;
  totalLogisticsCost: number;
  totalOperationalCost: number;
  totalCostBeforeMargin: number;
  totalMarginAmount: number;
  totalSellingPriceInr: number;
  totalSellingPriceForeign: number;
  netProfit: number;
  profitPerUnit: number;
  profitabilityScore: ProfitabilityScore;
  effectiveMarginPercent: number;
  includedCosts: { label: string; amount: number; category: string }[];
  excludedCosts: { label: string; amount: number; reason: string }[];
}
