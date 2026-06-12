import { z } from 'zod';

// ─── Master Data Schemas ───────────────────────────────────────────────────────

export const createCurrencyRateSchema = z.object({
  body: z.object({
    fromCurrency: z.enum(['INR', 'AUD', 'NZD', 'JPY', 'USD', 'EUR']),
    toCurrency: z.enum(['INR', 'AUD', 'NZD', 'JPY', 'USD', 'EUR']),
    rate: z.number().positive('Rate must be positive'),
    source: z.enum(['MANUAL', 'LIVE']).default('MANUAL'),
  }),
});

export const createFreightTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    originPort: z.string().min(1, 'Origin port is required'),
    destinationPort: z.string().min(1, 'Destination port is required'),
    destinationCountry: z.string().min(1, 'Destination country is required'),
    freightCost20ft: z.number().positive('20ft cost must be positive'),
    freightCost40ft: z.number().positive('40ft cost must be positive'),
    transitDays: z.number().int().positive().optional(),
    validFrom: z.string().datetime({ offset: true }).or(z.string().date()),
    validTo: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
    isActive: z.boolean().default(true),
  }),
});

export const upsertPortChargeSchema = z.object({
  body: z.object({
    portName: z.string().min(1, 'Port name is required'),
    chaCharges: z.number().nonnegative(),
    portCharges: z.number().nonnegative(),
    handlingCharges: z.number().nonnegative(),
    documentCharges: z.number().nonnegative(),
  }),
});

export const freightTemplateQuerySchema = z.object({
  query: z.object({
    destinationCountry: z.string().optional(),
    isActive: z
      .string()
      .optional()
      .transform((v) => (v === 'false' ? false : true)),
  }),
});

export type CreateCurrencyRateInput = z.infer<typeof createCurrencyRateSchema>['body'];
export type CreateFreightTemplateInput = z.infer<typeof createFreightTemplateSchema>['body'];
export type UpsertPortChargeInput = z.infer<typeof upsertPortChargeSchema>['body'];
