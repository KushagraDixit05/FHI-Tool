import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db';
import type { CreateUserInput, UpdateRoleInput } from './user.schema';
import { AppError } from '../../shared/errors/AppError';

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { quotes: true } },
    },
  });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

export async function createUser(data: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError(409, 'Email already in use');

  const password = data.password
    ? await bcrypt.hash(data.password, 12)
    : await bcrypt.hash(Math.random().toString(36), 12); // random password if not provided (OAuth user)

  return prisma.user.create({
    data: { name: data.name, email: data.email, password, role: data.role as never },
    select: {
      id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
    },
  });
}

export async function updateUserRole(id: string, data: UpdateRoleInput) {
  await getUserById(id);
  return prisma.user.update({
    where: { id },
    data: { role: data.role as never },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
}

export async function toggleUserActive(id: string) {
  const user = await getUserById(id);
  return prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
}
