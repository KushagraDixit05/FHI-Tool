import { z } from 'zod';

// ─── Buyer Schemas ─────────────────────────────────────────────────────────────

export const createBuyerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Buyer name is required'),
    companyName: z.string().min(1, 'Company name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    address: z.string().optional(),
    country: z.string().min(1, 'Country is required'),
    region: z.string().optional(),
    currency: z.enum(['INR', 'AUD', 'NZD', 'JPY', 'USD', 'EUR']).default('USD'),
    buyerCategory: z.enum([
      'DISTRIBUTOR',
      'RETAILER',
      'HOSPITALITY',
      'IMPORTER',
      'WHOLESALER',
      'MARKETPLACE',
      'OEM_BUYER',
    ]),
    portOfDest: z.string().optional(),
    productInterests: z.array(z.string()).default([]),
    notes: z.string().optional(),
  }),
});

export const updateBuyerSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    companyName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    country: z.string().optional(),
    region: z.string().optional(),
    currency: z.enum(['INR', 'AUD', 'NZD', 'JPY', 'USD', 'EUR']).optional(),
    buyerCategory: z
      .enum([
        'DISTRIBUTOR',
        'RETAILER',
        'HOSPITALITY',
        'IMPORTER',
        'WHOLESALER',
        'MARKETPLACE',
        'OEM_BUYER',
      ])
      .optional(),
    portOfDest: z.string().optional(),
    productInterests: z.array(z.string()).optional(),
    notes: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listBuyersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(Number).pipe(z.number().min(1).default(1)),
    limit: z.string().optional().transform(Number).pipe(z.number().min(1).max(100).default(20)),
    search: z.string().optional(),
    country: z.string().optional(),
    category: z.string().optional(),
    isActive: z.string().optional().transform((v) => v === 'false' ? false : v === 'true' ? true : undefined),
  }),
});

export type CreateBuyerInput = z.infer<typeof createBuyerSchema>['body'];
export type UpdateBuyerInput = z.infer<typeof updateBuyerSchema>['body'];
export type ListBuyersQuery = z.infer<typeof listBuyersQuerySchema>['query'];
