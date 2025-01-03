import { NextRequest, NextResponse } from 'next/server';
import { db, ensureServerSide } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { user } from '@/lib/db/schema';
import type { User } from '@/lib/db/schema';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    ensureServerSide();

    try {
        if (!db) {
            throw new Error('Database connection not available');
        }

        const userData = await request.json() as Partial<User>;

        const existingUser = await db.query.user.findFirst({
            where: (u) => eq(u.id, params.id)
        });

        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updateData: Partial<User> = {};
        if (userData.email !== undefined) updateData.email = userData.email;
        if (userData.role !== undefined) updateData.role = userData.role;
        if (userData.name !== undefined) updateData.name = userData.name;
        if (userData.displayName !== undefined) updateData.displayName = userData.displayName;
        if (userData.photoURL !== undefined) updateData.photoURL = userData.photoURL;
        if (userData.data !== undefined) updateData.data = userData.data;

        const [updatedUser] = await db
            .update(user)
            .set(updateData)
            .where(eq(user.id, params.id))
            .returning();

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    ensureServerSide();

    try {
        if (!db) {
            throw new Error('Database connection not available');
        }

        const existingUser = await db.query.user.findFirst({
            where: (u) => eq(u.id, params.id)
        });

        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const [deletedUser] = await db
            .delete(user)
            .where(eq(user.id, params.id))
            .returning();

        return NextResponse.json(deletedUser);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 