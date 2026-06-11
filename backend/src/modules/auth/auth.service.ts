import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { RegisterInput, LoginInput } from './auth.schema';

type Role = 'ADMIN' | 'TRADE_MANAGER' | 'SALES' | 'FINANCE' | 'OPERATIONS';

export async function registerUser(data: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw Object.assign(new Error('Email already in use'), { statusCode: 409 });
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: (data.role as Role) ?? 'SALES',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  const token = generateToken(user.id, user.email, user.role);
  return { user, token };
}

export async function loginUser(data: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user || !user.isActive) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  const token = generateToken(user.id, user.email, user.role);
  const { password: _, ...safeUser } = user;

  return { user: safeUser, token };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
}

function generateToken(userId: string, email: string, role: string): string {
  return jwt.sign({ userId, email, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}
