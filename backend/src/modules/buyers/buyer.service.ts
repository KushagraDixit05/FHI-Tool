import { prisma } from '../../config/db';
import type { CreateBuyerInput, UpdateBuyerInput, ListBuyersQuery } from './buyer.schema';
import { AppError } from '../../shared/errors/AppError';
import { paginatedResult } from '../../shared/http/pagination';

export async function listBuyers(query: ListBuyersQuery) {
  const { page, limit, search, country, category, isActive } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(isActive !== undefined ? { isActive } : {}),
    ...(country ? { country: { equals: country, mode: 'insensitive' as const } } : {}),
    ...(category ? { buyerCategory: category as never } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { companyName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { country: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.buyer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { quotes: true } } },
    }),
    prisma.buyer.count({ where }),
  ]);

  return paginatedResult(data, total, { page, limit });
}

export async function getBuyerById(id: string) {
  const buyer = await prisma.buyer.findUnique({
    where: { id },
    include: { _count: { select: { quotes: true } } },
  });
  if (!buyer) throw new AppError(404, 'Buyer not found');
  return buyer;
}

export async function createBuyer(data: CreateBuyerInput) {
  return prisma.buyer.create({ data });
}

export async function updateBuyer(id: string, data: UpdateBuyerInput) {
  await getBuyerById(id); // ensures 404 if not found
  return prisma.buyer.update({ where: { id }, data });
}

export async function softDeleteBuyer(id: string) {
  await getBuyerById(id);
  return prisma.buyer.update({ where: { id }, data: { isActive: false } });
}

export async function getBuyerQuotes(
  id: string,
  page: number = 1,
  limit: number = 10
) {
  await getBuyerById(id);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.quote.findMany({
      where: { buyerId: id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        quoteNumber: true,
        status: true,
        currency: true,
        incoterm: true,
        createdAt: true,
        updatedAt: true,
        items: { select: { totalLineValue: true } },
      },
    }),
    prisma.quote.count({ where: { buyerId: id } }),
  ]);

  return paginatedResult(data, total, { page, limit });
}
