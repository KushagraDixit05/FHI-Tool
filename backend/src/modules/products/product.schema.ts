import { z } from 'zod';

// ─── Product Schemas ──────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  body: z.object({
    productCode: z.string().min(1, 'Product code is required'),
    description: z.string().min(1, 'Description is required'),
    productTypeId: z.string().cuid('Invalid product type ID'),
    moq: z.number().int().positive().optional(),
    imageUrl: z.string().url().optional(),
    attributes: z.record(z.unknown()).optional(),
    baseSupplierCost: z.number().positive().optional(),
    packagingDetails: z.record(z.unknown()).optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    description: z.string().min(1).optional(),
    moq: z.number().int().positive().optional(),
    imageUrl: z.string().url().optional().nullable(),
    attributes: z.record(z.unknown()).optional(),
    baseSupplierCost: z.number().positive().optional(),
    packagingDetails: z.record(z.unknown()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listProductsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(Number).pipe(z.number().min(1).default(1)),
    limit: z.string().optional().transform(Number).pipe(z.number().min(1).max(100).default(20)),
    search: z.string().optional(),
    lineId: z.string().optional(),
    categoryId: z.string().optional(),
    typeId: z.string().optional(),
    isActive: z
      .string()
      .optional()
      .transform((v) => (v === 'false' ? false : v === 'true' ? true : undefined)),
  }),
});

// ─── Category-Specific Attribute Schemas ─────────────────────────────────────

export const textileAttributesSchema = z.object({
  material: z.string().min(1, 'Material is required'),
  gsm: z.number().positive('GSM must be positive'),
  size: z.string().min(1, 'Size is required'),
  color: z.string().min(1, 'Color is required'),
  weaveType: z.string().optional(),
  stitchingType: z.string().optional(),
  brandLabelRequired: z.boolean().default(false),
  packagingType: z.string().min(1, 'Packaging type is required'),
  unitsPerCarton: z.number().int().positive(),
  moq: z.number().int().positive(),
  privateLabel: z.boolean().default(false),
});

export const spiceAttributesSchema = z.object({
  spiceType: z.string().min(1),
  grade: z.string().min(1),
  originState: z.string().min(1),
  shelfLifeMonths: z.number().int().positive(),
  packagingType: z.string().min(1),
  fssaiRequired: z.boolean().default(true),
  labTesting: z.boolean().default(false),
  moistureLevel: z.number().min(0).max(100).optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
});

export const handicraftAttributesSchema = z.object({
  materialType: z.string().min(1),
  finish: z.string().min(1),
  isHandmade: z.boolean(),
  isFrag: z.boolean().default(false),
  exportPackagingType: z.string().min(1),
  productWeightKg: z.number().positive(),
  cartonVolumeCbm: z.number().positive().optional(),
  designSku: z.string().optional(),
  moq: z.number().int().positive(),
});

export const carpetAttributesSchema = z.object({
  material: z.string().min(1),
  weaveType: z.string().min(1),
  sizeInches: z.string().min(1),
  pile: z.string().optional(),
  knotsPerInch: z.number().int().positive().optional(),
  dyeType: z.string().optional(),
  moq: z.number().int().positive(),
});

export const stationeryAttributesSchema = z.object({
  productVariant: z.string().min(1),
  material: z.string().min(1),
  dimensions: z.string().optional(),
  color: z.string().optional(),
  customizationAvailable: z.boolean().default(false),
  moq: z.number().int().positive(),
});

export const cottonBagAttributesSchema = z.object({
  bagType: z.string().min(1),
  fabricWeight: z.number().positive(),
  sizeCm: z.string().min(1),
  handleType: z.string().optional(),
  printingType: z.string().optional(),
  isOrganic: z.boolean().default(false),
  moq: z.number().int().positive(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>['query'];
