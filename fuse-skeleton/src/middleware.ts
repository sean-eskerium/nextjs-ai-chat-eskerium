import { auth } from '@auth/authJs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function middleware(request: NextRequest) {
    const session = await auth();
    const pathname = request.nextUrl.pathname;

    // Handle API routes
    if (pathname.startsWith('/api/')) {
        // Skip auth check for auth-related API routes
        if (pathname.startsWith('/api/auth/')) {
            return NextResponse.next();
        }

        // For other API routes, check auth and return proper error response
        if (!session) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        return NextResponse.next();
    }

    // Handle web routes
    if (!session) {
        // Exclude sign-in and sign-up pages from auth check
        if (pathname === '/sign-in' || pathname === '/sign-up') {
            return NextResponse.next();
        }

        // Redirect to sign-in page for other routes
        const signInUrl = new URL('/sign-in', request.url);
        signInUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/:id', '/api/:path*', '/sign-in', '/sign-up']
};