export const INCOTERMS = ['EXW', 'FOB', 'CIF', 'CFR', 'DDP'] as const;
export type IncotermType = (typeof INCOTERMS)[number];

export const CURRENCIES = ['INR', 'AUD', 'NZD', 'JPY', 'USD', 'EUR'] as const;
export type CurrencyType = (typeof CURRENCIES)[number];

export const BUYER_CATEGORIES = [
  'DISTRIBUTOR',
  'RETAILER',
  'HOSPITALITY',
  'IMPORTER',
  'WHOLESALER',
  'MARKETPLACE',
  'OEM_BUYER',
] as const;

export const ROLES = ['ADMIN', 'TRADE_MANAGER', 'SALES', 'FINANCE', 'OPERATIONS'] as const;
export type RoleType = (typeof ROLES)[number];

export const QUOTE_STATUSES = [
  'DRAFT',
  'UNDER_REVIEW',
  'SENT_TO_BUYER',
  'NEGOTIATION',
  'APPROVED',
  'PO_RECEIVED',
  'SHIPMENT_PLANNED',
  'CLOSED',
  'LOST',
] as const;

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  UNDER_REVIEW: 'Under Review',
  SENT_TO_BUYER: 'Sent to Buyer',
  NEGOTIATION: 'Negotiation',
  APPROVED: 'Approved',
  PO_RECEIVED: 'PO Received',
  SHIPMENT_PLANNED: 'Shipment Planned',
  CLOSED: 'Closed',
  LOST: 'Lost',
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  SENT_TO_BUYER: 'bg-blue-100 text-blue-800',
  NEGOTIATION: 'bg-purple-100 text-purple-800',
  APPROVED: 'bg-green-100 text-green-800',
  PO_RECEIVED: 'bg-emerald-100 text-emerald-800',
  SHIPMENT_PLANNED: 'bg-cyan-100 text-cyan-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  LOST: 'bg-red-100 text-red-800',
};

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['UNDER_REVIEW', 'LOST'],
  UNDER_REVIEW: ['SENT_TO_BUYER', 'DRAFT', 'LOST'],
  SENT_TO_BUYER: ['NEGOTIATION', 'APPROVED', 'LOST'],
  NEGOTIATION: ['APPROVED', 'LOST'],
  APPROVED: ['PO_RECEIVED', 'LOST'],
  PO_RECEIVED: ['SHIPMENT_PLANNED'],
  SHIPMENT_PLANNED: ['CLOSED'],
  CLOSED: [],
  LOST: ['DRAFT'],
};

export const PERMISSIONS = {
  canCreateQuote: ['ADMIN', 'TRADE_MANAGER', 'SALES'],
  canEditQuote: ['ADMIN', 'TRADE_MANAGER', 'SALES'],
  canViewInternalDocs: ['ADMIN', 'TRADE_MANAGER', 'FINANCE'],
  canViewMarginAnalysis: ['ADMIN', 'FINANCE'],
  canManageUsers: ['ADMIN'],
  canEditMasterData: ['ADMIN', 'TRADE_MANAGER'],
  canViewAnalytics: ['ADMIN', 'TRADE_MANAGER', 'FINANCE'],
  canMarkShipment: ['ADMIN', 'TRADE_MANAGER', 'OPERATIONS'],
  canDeleteQuote: ['ADMIN'],
} as const;

export const PRODUCT_LINE_CODES = ['TXT', 'HND', 'CAR', 'STA', 'SPC', 'CTB'] as const;

export const ORIGIN_PORTS = ['Nhava Sheva (JNPT)', 'Chennai Port', 'Mundra Port', 'Kolkata Port'];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  AUD: 'A$',
  NZD: 'NZ$',
  JPY: '¥',
  USD: '$',
  EUR: '€',
};

export const PROFITABILITY_COLORS: Record<string, string> = {
  EXCELLENT: 'text-emerald-600',
  GOOD: 'text-green-600',
  ACCEPTABLE: 'text-yellow-600',
  LOW: 'text-orange-600',
  CRITICAL: 'text-red-600',
};
