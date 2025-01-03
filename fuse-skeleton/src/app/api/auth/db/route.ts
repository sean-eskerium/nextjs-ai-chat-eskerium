import { NextRequest, NextResponse } from 'next/server';
import { db, ensureServerSide } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { user } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
    // Ensure we're on the server side
    ensureServerSide();

    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    try {
        if (!db) {
            throw new Error('Database connection not available');
        }

        const result = await db.query.user.findFirst({
            where: (u) => eq(u.email, email)
        });

        if (!result) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    // Ensure we're on the server side
    ensureServerSide();

    try {
        const userData = await request.json();
        const email = userData.email;
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        if (!db) {
            throw new Error('Database connection not available');
        }

        const result = await db.query.user.findFirst({
            where: (u) => eq(u.email, email)
        });

        if (!result) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Only update fields that are defined in the schema
        const updateData = {
            name: userData.name !== undefined ? userData.name : result.name,
            role: userData.role !== undefined ? userData.role : result.role,
            emailVerified: userData.emailVerified !== undefined 
                ? userData.emailVerified ? new Date(userData.emailVerified) : null 
                : result.emailVerified
        };

        const updatedUser = await db
            .update(user)
            .set(updateData)
            .where(eq(user.email, email))
            .returning();

        return NextResponse.json(updatedUser[0]);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 