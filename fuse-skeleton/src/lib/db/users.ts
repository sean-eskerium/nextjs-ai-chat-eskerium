'use server';

import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { user } from './schema';
import type { User as DbUser } from './schema';
import type { User as AuthUser } from '@auth/user';

type UserData = {
    shortcuts: string[];
    settings: Record<string, unknown>;
};

export async function findUserByEmail(email: string) {
    const db = await getDb();
    console.log('findUserByEmail - Querying for email:', email);
    const userRecord = await db.query.user.findFirst({
        where: eq(user.email, email),
    });
    console.log('findUserByEmail - User found:', userRecord);

    if (!userRecord) return null;

    const dbUser = userRecord as unknown as DbUser;
    const userData = dbUser.data as UserData;

    return {
        id: dbUser.id,
        email: dbUser.email,
        displayName: dbUser.displayName || dbUser.email,
        photoURL: dbUser.photoURL || dbUser.image,
        role: dbUser.role,
        password: dbUser.password,
        shortcuts: userData?.shortcuts || [],
        settings: userData?.settings || {},
        loginRedirectUrl: '/'
    } as AuthUser;
}

export async function createUser(userData: { email: string } & Partial<Omit<DbUser, 'id' | 'email'>>) {
    const db = await getDb();
    const [createdUser] = await db
        .insert(user)
        .values({
            ...userData,
            role: userData.role || ['user'],
            data: { shortcuts: [], settings: {} },
        })
        .returning();
    return createdUser;
}

export async function updateUser(email: string, userData: Partial<Omit<DbUser, 'id' | 'email'>>) {
    const db = await getDb();
    const [updatedUser] = await db
        .update(user)
        .set(userData)
        .where(eq(user.email, email))
        .returning();
    return updatedUser;
} 