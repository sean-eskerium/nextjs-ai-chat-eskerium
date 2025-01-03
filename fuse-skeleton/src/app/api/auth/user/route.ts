import { db } from '@/lib/db/query';
import { user } from '@/lib/db/models/user';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const dbUser = await db.query.user.findFirst({
    where: eq(user.email, email)
  });

  return NextResponse.json(dbUser);
} 