import { prisma } from '../../config/db';
import type { CreateSupplierInput, UpdateSupplierInput, ListSuppliersQuery } from './supplier.schema';
import { AppError } from '../../shared/errors/AppError';
import { paginatedResult } from '../../shared/http/pagination';

export async function listSuppliers(query: ListSuppliersQuery) {
  const { page, limit, search, region, exportCapable } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(exportCapable !== undefined ? { exportCapable } : {}),
    ...(region ? { region: { contains: region, mode: 'insensitive' as const } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { contactPerson: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { region: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.supplier.count({ where }),
  ]);

  return paginatedResult(data, total, { page, limit });
}

export async function getSupplierById(id: string) {
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) throw new AppError(404, 'Supplier not found');
  return supplier;
}

export async function createSupplier(data: CreateSupplierInput) {
  return prisma.supplier.create({ data });
}

export async function updateSupplier(id: string, data: UpdateSupplierInput) {
  await getSupplierById(id);
  return prisma.supplier.update({ where: { id }, data });
}

export async function softDeleteSupplier(id: string) {
  await getSupplierById(id);
  return prisma.supplier.update({ where: { id }, data: { isActive: false } });
}
