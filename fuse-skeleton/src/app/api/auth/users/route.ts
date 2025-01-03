import { NextRequest, NextResponse } from 'next/server';
import { db, ensureServerSide } from '@/lib/db';
import { user } from '@/lib/db/schema';
import type { User } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
    ensureServerSide();

    try {
        if (!db) {
            throw new Error('Database connection not available');
        }

        const userData = await request.json() as Partial<User>;

        // Ensure required fields are present
        if (!userData.email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Set default values for optional fields
        const newUser = {
            email: userData.email,
            role: userData.role || ['user'],
            name: userData.name || '',
            displayName: userData.displayName || '',
            photoURL: userData.photoURL || '',
            data: userData.data || { shortcuts: [], settings: {} },
        };

        const [createdUser] = await db
            .insert(user)
            .values(newUser)
            .returning();

        return NextResponse.json(createdUser);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 