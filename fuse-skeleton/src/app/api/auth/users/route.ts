import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureServerSide } from '@/lib/db';
import { user } from '@/lib/db/schema';
import type { User } from '@/lib/db/schema';
import { hash } from 'bcrypt-ts';

export async function POST(request: NextRequest) {
    ensureServerSide();

    try {
        const db = await getDb();
        if (!db) {
            throw new Error('Database connection not available');
        }

        const userData = await request.json() as Partial<User>;

        // Ensure required fields are present
        if (!userData.email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Hash password if provided
        let hashedPassword = undefined;
        if (userData.password) {
            hashedPassword = await hash(userData.password, 10);
        }

        // Set default values for optional fields
        const newUser = {
            email: userData.email,
            role: userData.role || ['user'],
            displayName: userData.displayName || '',
            photoURL: userData.photoURL || '',
            data: userData.data || { shortcuts: [], settings: {} },
            password: hashedPassword
        };

        const [createdUser] = await db
            .insert(user)
            .values(newUser)
            .returning();

        // Don't send the password back
        const { password: _, ...userWithoutPassword } = createdUser;
        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 