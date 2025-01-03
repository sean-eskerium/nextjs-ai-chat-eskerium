'use server';

import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/db/users';
import { getDb, ensureServerSide } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ email: string }> }
) {
    ensureServerSide();

    try {
        const { email } = await params;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const db = getDb();
        if (!db) {
            throw new Error('Database connection not available');
        }

        const user = await findUserByEmail(email);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 