import { prisma } from '../../config/db';
import type { CreateProductInput, UpdateProductInput, ListProductsQuery } from './product.schema';
import { AppError } from '../../shared/errors/AppError';
import { paginatedResult } from '../../shared/http/pagination';

// ─── Product Hierarchy ────────────────────────────────────────────────────────

export async function getProductLines() {
  return prisma.productLine.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: { _count: { select: { categories: true } } },
  });
}

export async function getCategoriesByLine(lineId: string) {
  const line = await prisma.productLine.findUnique({ where: { id: lineId } });
  if (!line) throw new AppError(404, 'Product line not found');
  return prisma.productCategory.findMany({
    where: { productLineId: lineId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { types: true } } },
  });
}

export async function getTypesByCategory(categoryId: string) {
  const category = await prisma.productCategory.findUnique({ where: { id: categoryId } });
  if (!category) throw new AppError(404, 'Product category not found');
  return prisma.productType.findMany({
    where: { categoryId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function listProducts(query: ListProductsQuery) {
  const { page, limit, search, lineId, categoryId, typeId, isActive } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(isActive !== undefined ? { isActive } : {}),
    ...(typeId ? { productTypeId: typeId } : {}),
    ...(categoryId && !typeId
      ? { productType: { categoryId } }
      : {}),
    ...(lineId && !categoryId && !typeId
      ? { productType: { category: { productLineId: lineId } } }
      : {}),
    ...(search
      ? {
          OR: [
            { productCode: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        productType: {
          include: {
            category: {
              include: { productLine: true },
            },
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return paginatedResult(data, total, { page, limit });
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      productType: {
        include: { category: { include: { productLine: true } } },
      },
    },
  });
  if (!product) throw new AppError(404, 'Product not found');
  return product;
}

export async function createProduct(data: CreateProductInput) {
  // Validate productType exists
  const type = await prisma.productType.findUnique({ where: { id: data.productTypeId } });
  if (!type) throw new AppError(404, 'Product type not found');

  // Check code uniqueness
  const existing = await prisma.product.findUnique({ where: { productCode: data.productCode } });
  if (existing) throw new AppError(409, 'Product code already exists');

  return prisma.product.create({
    data: {
      ...data,
      attributes: data.attributes as any,
      packagingDetails: data.packagingDetails as any,
      baseSupplierCost: data.baseSupplierCost
        ? parseFloat(data.baseSupplierCost.toString())
        : undefined,
    },
    include: {
      productType: { include: { category: { include: { productLine: true } } } },
    },
  });
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  await getProductById(id);
  return prisma.product.update({
    where: { id },
    data: {
      ...data,
      attributes: data.attributes as any,
      packagingDetails: data.packagingDetails as any,
    },
    include: {
      productType: { include: { category: { include: { productLine: true } } } },
    },
  });
}

export async function searchProducts(q: string) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { productCode: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    },
    take: 20,
    include: {
      productType: { include: { category: { include: { productLine: true } } } },
    },
  });
}
