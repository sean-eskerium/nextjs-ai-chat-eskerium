'use server';

import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { user } from './schema';
import type { User } from './schema';

export async function findUserByEmail(email: string) {
    const db = getDb();
    const dbInstance = await db;
    console.log('findUserByEmail - Querying for email:', email);
    const userRecord = await dbInstance.query.user.findFirst({
        where: eq(user.email, email),
    });
    console.log('findUserByEmail - User found:', userRecord);
    return userRecord;
}

export async function createUser(userData: { email: string } & Partial<Omit<User, 'id' | 'email'>>) {
    const db = getDb();
    const [createdUser] = await db
        .insert(user)
        .values({
            ...userData,
            role: userData.role || ['user'],
            data: userData.data || { shortcuts: [], settings: {} },
        })
        .returning();
    return createdUser;
}

export async function updateUser(email: string, userData: Partial<Omit<User, 'id' | 'email'>>) {
    const db = getDb();
    const [updatedUser] = await db
        .update(user)
        .set(userData)
        .where(eq(user.email, email))
        .returning();
    return updatedUser;
} 