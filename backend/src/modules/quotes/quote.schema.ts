import { z } from 'zod';

const quoteItemSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitSupplierCost: z.number().nonnegative(),
  packagingCostPerUnit: z.number().nonnegative(),
  labelingCostPerUnit: z.number().nonnegative(),
  qcCostPerUnit: z.number().nonnegative(),
  samplingCost: z.number().nonnegative(),
  toolingCost: z.number().nonnegative(),
  marginPercent: z.number().min(0).max(100),
  totalProductCostInr: z.number().nonnegative(),
  unitSellingPrice: z.number().nonnegative(),
  totalLineValue: z.number().nonnegative(),
  unitsPerCarton: z.number().int().positive().optional(),
  cartonsPerPallet: z.number().int().positive().optional(),
  cartonLWHCm: z.object({ l: z.number(), w: z.number(), h: z.number() }).optional(),
  cartonWeightKg: z.number().positive().optional(),
  totalCbm: z.number().nonnegative().optional(),
  totalWeightKg: z.number().nonnegative().optional(),
});

const quoteCostSchema = z.object({
  category: z.enum(['PRODUCT', 'LOGISTICS', 'OPERATIONAL', 'MARGIN']),
  label: z.string().min(1),
  amount: z.number().nonnegative(),
  isIncluded: z.boolean().default(true),
  isOptional: z.boolean().default(false),
  notes: z.string().optional(),
});

export const createQuoteSchema = z.object({
  body: z.object({
    buyerId: z.string().cuid('Invalid buyer ID'),
    incoterm: z.enum(['EXW', 'FOB', 'CIF', 'CFR', 'DDP']),
    currency: z.enum(['INR', 'AUD', 'NZD', 'JPY', 'USD', 'EUR']),
    exchangeRate: z.number().positive('Exchange rate is required'),
    fxBuffer: z.number().min(0).max(20).default(2),
    notes: z.string().optional(),
    internalNotes: z.string().optional(),
    validUntil: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
    items: z.array(quoteItemSchema).min(1, 'At least one product is required'),
    costs: z.array(quoteCostSchema).default([]),
  }),
});

export const updateQuoteSchema = z.object({
  body: z.object({
    incoterm: z.enum(['EXW', 'FOB', 'CIF', 'CFR', 'DDP']).optional(),
    currency: z.enum(['INR', 'AUD', 'NZD', 'JPY', 'USD', 'EUR']).optional(),
    exchangeRate: z.number().positive().optional(),
    fxBuffer: z.number().min(0).max(20).optional(),
    notes: z.string().optional(),
    internalNotes: z.string().optional(),
    validUntil: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
    items: z.array(quoteItemSchema).min(1).optional(),
    costs: z.array(quoteCostSchema).optional(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    toStatus: z.enum([
      'DRAFT',
      'UNDER_REVIEW',
      'SENT_TO_BUYER',
      'NEGOTIATION',
      'APPROVED',
      'PO_RECEIVED',
      'SHIPMENT_PLANNED',
      'CLOSED',
      'LOST',
    ]),
    note: z.string().optional(),
  }),
});

export const listQuotesQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(Number).pipe(z.number().min(1).default(1)),
    limit: z.string().optional().transform(Number).pipe(z.number().min(1).max(100).default(20)),
    status: z.string().optional(),
    buyerId: z.string().optional(),
    search: z.string().optional(),
  }),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>['body'];
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>['body'];
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>['body'];
export type ListQuotesQuery = z.infer<typeof listQuotesQuerySchema>['query'];
