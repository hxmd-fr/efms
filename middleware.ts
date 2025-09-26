import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the session token cookie exists
  const token = request.cookies.get('session_token');

  // If the user is trying to access the dashboard without a token, redirect them to login
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user is logged in and tries to access the login page, redirect them to the dashboard
  if (token && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// This configures the middleware to run only on specific paths
export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
