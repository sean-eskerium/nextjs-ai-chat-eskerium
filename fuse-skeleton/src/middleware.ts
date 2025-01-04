import { auth } from '@auth/authJs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function middleware(request: NextRequest) {
    const session = await auth();
    const pathname = request.nextUrl.pathname;

    // Block any chat-app specific routes
    if (pathname.startsWith('/api/vote') || pathname.startsWith('/api/history')) {
        return NextResponse.json(
            { error: 'Route not found' },
            { status: 404 }
        );
    }

    // Public routes that don't require authentication
    const publicRoutes = ['/sign-in', '/sign-up', '/auth', '/assets'];
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

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

    // Handle protected routes
    if (!session) {
        const signInUrl = new URL('/sign-in', request.url);
        signInUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
}

// Match all routes except static files and public assets
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * 1. /api/auth/* (auth endpoints)
         * 2. /_next/* (Next.js internals)
         * 3. /fonts/* (inside public directory)
         * 4. /favicon.ico, /sitemap.xml (public files)
         */
        '/((?!api/auth|_next|fonts|favicon.ico|sitemap.xml).*)',
    ],
};