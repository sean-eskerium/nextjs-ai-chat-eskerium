import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  role: z.array(z.string()).default(['user']),
  photoURL: z.string().url().optional(),
  image: z.string().optional(),
  data: z.object({
    shortcuts: z.array(z.string()).default([]),
    settings: z.record(z.unknown()).default({})
  }).default({ shortcuts: [], settings: {} })
});

export const updateUserSchema = userSchema.partial().omit({ email: true });

export const userResponseSchema = userSchema.extend({
  id: z.string().uuid(),
  emailVerified: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type User = z.infer<typeof userSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>; 