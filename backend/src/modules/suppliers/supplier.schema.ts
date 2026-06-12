import { z } from 'zod';

// ─── Supplier Schemas ──────────────────────────────────────────────────────────

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Supplier name is required'),
    contactPerson: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    region: z.string().optional(),
    gstNumber: z.string().optional(),
    iecNumber: z.string().optional(),
    exportCapable: z.boolean().default(true),
    moq: z.number().int().positive().optional(),
    leadTimeDays: z.number().int().positive().optional(),
    certifications: z.array(z.string()).default([]),
    notes: z.string().optional(),
  }),
});

export const updateSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    contactPerson: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    region: z.string().optional(),
    gstNumber: z.string().optional(),
    iecNumber: z.string().optional(),
    exportCapable: z.boolean().optional(),
    moq: z.number().int().positive().optional(),
    leadTimeDays: z.number().int().positive().optional(),
    certifications: z.array(z.string()).optional(),
    notes: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listSuppliersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(Number).pipe(z.number().min(1).default(1)),
    limit: z.string().optional().transform(Number).pipe(z.number().min(1).max(100).default(20)),
    search: z.string().optional(),
    region: z.string().optional(),
    exportCapable: z
      .string()
      .optional()
      .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  }),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>['body'];
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>['body'];
export type ListSuppliersQuery = z.infer<typeof listSuppliersQuerySchema>['query'];
