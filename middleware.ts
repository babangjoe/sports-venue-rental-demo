import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is an admin route
  if (pathname.startsWith('/admin/')) {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      // Redirect to login page
      const url = new URL('/login', request.url);
      const referer = request.headers.get('referer');
      if (referer) {
        url.searchParams.set('returnUrl', request.nextUrl.pathname);
      }
      return NextResponse.redirect(url);
    }

    try {
      // Simple token verification (decode only, not verify signature)
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      // Decode the payload
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

      // Check for specific role-based access
      if (pathname.startsWith('/admin/dashboard') && payload.role !== 'owner') {
        // Only owners can access dashboard
        const url = new URL('/admin/fields', request.url);
        return NextResponse.redirect(url);
      }
      
      // Cashier role restrictions
      if (payload.role === 'cashier') {
        // Cashier can only access /admin/kasir and /booking (public)
        // If trying to access other admin pages, redirect to /admin/kasir
        if (!pathname.startsWith('/admin/kasir')) {
           const url = new URL('/admin/kasir', request.url);
           return NextResponse.redirect(url);
        }
      }

      // Add user info to headers for server-side use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId);
      requestHeaders.set('x-user-role', payload.role);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      // Token is invalid, redirect to login page
      console.log('Middleware: Invalid token, redirecting to login');
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};