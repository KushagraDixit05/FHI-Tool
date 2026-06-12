import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    role: z
      .enum(['ADMIN', 'TRADE_MANAGER', 'SALES', 'FINANCE', 'OPERATIONS'])
      .default('SALES'),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(['ADMIN', 'TRADE_MANAGER', 'SALES', 'FINANCE', 'OPERATIONS']),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>['body'];
