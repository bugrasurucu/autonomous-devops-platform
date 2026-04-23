import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATHS = ['/dashboard'];
const AUTH_PATHS = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // For dashboard routes, check for auth token in cookie
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    // No cookie token — allow client-side auth-context to handle via localStorage
    // This middleware is a secondary guard for server-side rendered pages
    return NextResponse.next();
  }

  if (isAuthPage && token) {
    // Already authenticated, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
