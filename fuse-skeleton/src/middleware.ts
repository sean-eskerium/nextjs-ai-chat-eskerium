import { auth } from '@auth/authJs';
 
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  
  // Allow public routes
  if (['/sign-in'].includes(nextUrl.pathname)) {
    return null;
  }

  // Protect all other routes
  if (!isLoggedIn) {
    const signInUrl = new URL('/sign-in', process.env.NEXTAUTH_URL);
    return Response.redirect(signInUrl);
  }

  return null;
});

// Optionally configure which routes to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};