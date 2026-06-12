import { prisma } from '../../config/db';
import { Prisma } from '@prisma/client';
import { logger } from '../../config/logger';
import { generateQuoteNumber, extractQuoteCodeContext } from './quote-number.service';
import type { CreateQuoteInput, UpdateQuoteInput, UpdateStatusInput, ListQuotesQuery } from './quote.schema';
import { AppError } from '../../shared/errors/AppError';
import { paginatedResult } from '../../shared/http/pagination';

type PrismaTx = Prisma.TransactionClient;


type QuoteStatus =
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'SENT_TO_BUYER'
  | 'NEGOTIATION'
  | 'APPROVED'
  | 'PO_RECEIVED'
  | 'SHIPMENT_PLANNED'
  | 'CLOSED'
  | 'LOST';

const STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
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

// ─── Full quote include spec — reused across queries ──────────────────────────
const QUOTE_INCLUDE = {
  buyer: { select: { id: true, name: true, companyName: true, country: true, currency: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  items: {
    include: {
      product: {
        include: {
          productType: { include: { category: { include: { productLine: true } } } },
        },
      },
    },
  },
  costs: true,
  statusHistory: {
    include: { changedBy: { select: { id: true, name: true } } },
    orderBy: { changedAt: 'desc' as const },
  },
  documents: true,
} as const;

// ─── List Quotes ──────────────────────────────────────────────────────────────

export async function listQuotes(query: ListQuotesQuery) {
  const { page, limit, status, buyerId, search } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(status ? { status: status as QuoteStatus } : {}),
    ...(buyerId ? { buyerId } : {}),
    ...(search
      ? {
          OR: [
            { quoteNumber: { contains: search, mode: 'insensitive' as const } },
            { buyer: { name: { contains: search, mode: 'insensitive' as const } } },
            { buyer: { companyName: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { id: true, name: true, companyName: true, country: true } },
        createdBy: { select: { id: true, name: true } },
        items: { select: { totalLineValue: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.quote.count({ where }),
  ]);

  return paginatedResult(data, total, { page, limit });
}

// ─── Get Quote Stats ──────────────────────────────────────────────────────────

export async function getQuoteStats() {
  const activeStatuses: QuoteStatus[] = [
    'DRAFT', 'UNDER_REVIEW', 'SENT_TO_BUYER', 'NEGOTIATION', 'APPROVED', 'PO_RECEIVED',
  ];

  const [active, total, wonThisMonth] = await Promise.all([
    prisma.quote.count({ where: { status: { in: activeStatuses } } }),
    prisma.quote.count(),
    prisma.quote.count({
      where: {
        status: 'CLOSED',
        updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
  ]);

  return { activeQuotes: active, totalQuotes: total, wonThisMonth };
}

// ─── Get Quote By ID ──────────────────────────────────────────────────────────

export async function getQuoteById(id: string) {
  const quote = await prisma.quote.findUnique({ where: { id }, include: QUOTE_INCLUDE });
  if (!quote) throw new AppError(404, 'Quote not found');
  return quote;
}

// ─── Create Quote ─────────────────────────────────────────────────────────────

export async function createQuote(data: CreateQuoteInput, userId: string) {
  // Validate buyer exists
  const buyer = await prisma.buyer.findUnique({ where: { id: data.buyerId } });
  if (!buyer) throw new AppError(404, 'Buyer not found');

  // Determine quote number context from first product's line
  let productLineCode = 'GEN';
  if (data.items[0]) {
    const product = await prisma.product.findUnique({
      where: { id: data.items[0].productId },
      include: { productType: { include: { category: { include: { productLine: true } } } } },
    });
    productLineCode = product?.productType.category.productLine.code ?? 'GEN';
  }

  const { categoryCode, countryCode } = extractQuoteCodeContext(productLineCode, buyer.country);
  const quoteNumber = await generateQuoteNumber(categoryCode, countryCode, prisma);

  // Use a transaction to create quote + items + costs + initial status history atomically
  const quote = await prisma.$transaction(async (tx: PrismaTx) => {
    const newQuote = await tx.quote.create({

      data: {
        quoteNumber,
        buyerId: data.buyerId,
        createdById: userId,
        incoterm: data.incoterm as never,
        currency: data.currency as never,
        exchangeRate: data.exchangeRate,
        fxBuffer: data.fxBuffer,
        notes: data.notes,
        internalNotes: data.internalNotes,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitSupplierCost: item.unitSupplierCost,
            packagingCostPerUnit: item.packagingCostPerUnit,
            labelingCostPerUnit: item.labelingCostPerUnit,
            qcCostPerUnit: item.qcCostPerUnit,
            samplingCost: item.samplingCost,
            toolingCost: item.toolingCost,
            marginPercent: item.marginPercent,
            totalProductCostInr: item.totalProductCostInr,
            unitSellingPrice: item.unitSellingPrice,
            totalLineValue: item.totalLineValue,
            unitsPerCarton: item.unitsPerCarton,
            cartonsPerPallet: item.cartonsPerPallet,
            cartonLWHCm: item.cartonLWHCm ?? undefined,
            cartonWeightKg: item.cartonWeightKg,
            totalCbm: item.totalCbm,
            totalWeightKg: item.totalWeightKg,
          })),
        },
        costs: {
          create: data.costs.map((cost) => ({
            category: cost.category as never,
            label: cost.label,
            amount: cost.amount,
            isIncluded: cost.isIncluded,
            isOptional: cost.isOptional,
            notes: cost.notes,
          })),
        },
        statusHistory: {
          create: {
            fromStatus: undefined,
            toStatus: 'DRAFT' as never,
            changedById: userId,
            note: 'Quote created',
          },
        },
      },
      include: QUOTE_INCLUDE,
    });

    return newQuote;
  });

  logger.info(`Quote created: ${quoteNumber} by user ${userId}`);
  return quote;
}

// ─── Update Quote ─────────────────────────────────────────────────────────────

export async function updateQuote(id: string, data: UpdateQuoteInput, userId: string) {
  const existing = await getQuoteById(id);

  if (existing.status !== 'DRAFT') {
    throw Object.assign(
      new Error('Only DRAFT quotes can be edited. Change status back to DRAFT first.'),
      { statusCode: 422 }
    );
  }

  const quote = await prisma.$transaction(async (tx: PrismaTx) => {
    // Delete existing items and costs, recreate
    if (data.items) {
      await tx.quoteItem.deleteMany({ where: { quoteId: id } });
    }
    if (data.costs) {
      await tx.quoteCost.deleteMany({ where: { quoteId: id } });
    }

    return tx.quote.update({
      where: { id },
      data: {
        ...(data.incoterm ? { incoterm: data.incoterm as never } : {}),
        ...(data.currency ? { currency: data.currency as never } : {}),
        ...(data.exchangeRate !== undefined ? { exchangeRate: data.exchangeRate } : {}),
        ...(data.fxBuffer !== undefined ? { fxBuffer: data.fxBuffer } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.internalNotes !== undefined ? { internalNotes: data.internalNotes } : {}),
        ...(data.validUntil !== undefined
          ? { validUntil: data.validUntil ? new Date(data.validUntil) : null }
          : {}),
        ...(data.items
          ? {
              items: {
                create: data.items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  unitSupplierCost: item.unitSupplierCost,
                  packagingCostPerUnit: item.packagingCostPerUnit,
                  labelingCostPerUnit: item.labelingCostPerUnit,
                  qcCostPerUnit: item.qcCostPerUnit,
                  samplingCost: item.samplingCost,
                  toolingCost: item.toolingCost,
                  marginPercent: item.marginPercent,
                  totalProductCostInr: item.totalProductCostInr,
                  unitSellingPrice: item.unitSellingPrice,
                  totalLineValue: item.totalLineValue,
                  unitsPerCarton: item.unitsPerCarton,
                  cartonsPerPallet: item.cartonsPerPallet,
                  cartonLWHCm: item.cartonLWHCm ?? undefined,
                  cartonWeightKg: item.cartonWeightKg,
                  totalCbm: item.totalCbm,
                  totalWeightKg: item.totalWeightKg,
                })),
              },
            }
          : {}),
        ...(data.costs
          ? {
              costs: {
                create: data.costs.map((cost) => ({
                  category: cost.category as never,
                  label: cost.label,
                  amount: cost.amount,
                  isIncluded: cost.isIncluded,
                  isOptional: cost.isOptional,
                  notes: cost.notes,
                })),
              },
            }
          : {}),
      },
      include: QUOTE_INCLUDE,
    });
  });

  logger.info(`Quote updated: ${id} by user ${userId}`);
  return quote;
}

// ─── Update Quote Status ──────────────────────────────────────────────────────

export async function updateQuoteStatus(
  id: string,
  data: UpdateStatusInput,
  userId: string
) {
  const quote = await getQuoteById(id);
  const fromStatus = quote.status as QuoteStatus;
  const toStatus = data.toStatus as QuoteStatus;

  const allowedTransitions = STATUS_TRANSITIONS[fromStatus] ?? [];
  if (!allowedTransitions.includes(toStatus)) {
    throw Object.assign(
      new Error(
        `Invalid status transition: ${fromStatus} → ${toStatus}. Allowed: ${allowedTransitions.join(', ') || 'none'}`
      ),
      { statusCode: 422 }
    );
  }

  const updated = await prisma.$transaction(async (tx: PrismaTx) => {
    const q = await tx.quote.update({

      where: { id },
      data: { status: toStatus as never },
      include: QUOTE_INCLUDE,
    });
    await tx.quoteStatusHistory.create({
      data: {
        quoteId: id,
        fromStatus: fromStatus as never,
        toStatus: toStatus as never,
        changedById: userId,
        note: data.note,
      },
    });
    return q;
  });

  logger.info(`Quote ${id} status: ${fromStatus} → ${toStatus} by user ${userId}`);
  return updated;
}

// ─── Delete Quote ─────────────────────────────────────────────────────────────

export async function deleteQuote(id: string) {
  const quote = await getQuoteById(id);
  if (quote.status !== 'DRAFT') {
    throw new AppError(422, 'Only DRAFT quotes can be deleted');
  }
  await prisma.quote.delete({ where: { id } });
  logger.info(`Quote deleted: ${id}`);
}

// ─── Duplicate Quote ──────────────────────────────────────────────────────────

export async function duplicateQuote(id: string, userId: string) {
  const source = await getQuoteById(id);

  const { categoryCode, countryCode } = extractQuoteCodeContext(
    source.items[0]?.product?.productType?.category?.productLine?.code,
    source.buyer?.country
  );
  const quoteNumber = await generateQuoteNumber(categoryCode, countryCode, prisma);

  const duplicate = await prisma.$transaction(async (tx: PrismaTx) => {
    return tx.quote.create({
      data: {
        quoteNumber,
        buyerId: source.buyerId,
        createdById: userId,
        incoterm: source.incoterm,
        currency: source.currency,
        exchangeRate: source.exchangeRate,
        fxBuffer: source.fxBuffer,
        notes: source.notes,
        internalNotes: `[Duplicated from ${source.quoteNumber}] ${source.internalNotes ?? ''}`.trim(),
        validUntil: source.validUntil,
        items: {
          create: source.items.map((item: typeof source.items[number]) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitSupplierCost: item.unitSupplierCost,
            packagingCostPerUnit: item.packagingCostPerUnit,
            labelingCostPerUnit: item.labelingCostPerUnit,
            qcCostPerUnit: item.qcCostPerUnit,
            samplingCost: item.samplingCost,
            toolingCost: item.toolingCost,
            marginPercent: item.marginPercent,
            totalProductCostInr: item.totalProductCostInr,
            unitSellingPrice: item.unitSellingPrice,
            totalLineValue: item.totalLineValue,
            unitsPerCarton: item.unitsPerCarton,
            cartonsPerPallet: item.cartonsPerPallet,
            cartonLWHCm: (item.cartonLWHCm as Record<string, number> | null) ?? undefined,
            cartonWeightKg: item.cartonWeightKg,
            totalCbm: item.totalCbm,
            totalWeightKg: item.totalWeightKg,
          })),
        },
        costs: {
          create: source.costs.map((cost: typeof source.costs[number]) => ({
            category: cost.category,
            label: cost.label,
            amount: cost.amount,
            isIncluded: cost.isIncluded,
            isOptional: cost.isOptional,
            notes: cost.notes,
          })),
        },

        statusHistory: {
          create: {
            toStatus: 'DRAFT' as never,
            changedById: userId,
            note: `Duplicated from ${source.quoteNumber}`,
          },
        },
      },
      include: QUOTE_INCLUDE,
    });
  });

  logger.info(`Quote duplicated: ${source.quoteNumber} → ${quoteNumber}`);
  return duplicate;
}
