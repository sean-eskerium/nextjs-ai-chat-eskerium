import { auth } from '@auth/authJs';
 
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  
  // Allow public routes and assets
  const publicPaths = [
    '/sign-in',
    '/assets',
    '/api/auth',
    '/_next',
    '/favicon.ico'
  ];

  if (publicPaths.some(path => nextUrl.pathname.startsWith(path))) {
    return null;
  }

  // Protect all other routes
  if (!isLoggedIn) {
    const signInUrl = new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001');
    return Response.redirect(signInUrl);
  }

  return null;
});

// Configure which routes to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (public assets)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|assets).*)'
  ]
};