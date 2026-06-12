// Re-export all shared types for frontend use
export type {
  PaginatedResponse,
  Role,
  User,
  BuyerCategory,
  Currency,
  Buyer,
  ProductLine,
  ProductCategory,
  ProductType,
  Product,
  Supplier,
  CurrencyRate,
  FreightTemplate,
  PortChargeTemplate,
  Incoterm,
  QuoteStatus,
  CostCategory,
  DocType,
  QuoteItem,
  QuoteCost,
  QuoteStatusHistory,
  QuoteDocument,
  Quote,
  CostingInput,
  CostingResult,
  ProfitabilityScore,
} from '../../shared/types';

// ─── Frontend-only API response types ─────────────────────────────────────────

export interface ApiError {
  error: string;
  message?: string;
  issues?: { field: string; message: string }[];
}

export interface MasterDataState {
  productLines: import('../../shared/types').ProductLine[];
  currencies: import('../../shared/types').CurrencyRate[];
  freightTemplates: import('../../shared/types').FreightTemplate[];
  portCharges: import('../../shared/types').PortChargeTemplate[];
}
