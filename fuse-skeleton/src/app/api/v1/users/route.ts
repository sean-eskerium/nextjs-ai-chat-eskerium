import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { user } from '@/lib/db/schema';

export async function GET() {
  try {
    const db = await getDb();
    const users = await db.query.user.findMany();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 