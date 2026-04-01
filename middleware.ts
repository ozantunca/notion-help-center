import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getAdminCredentials,
  verifyBasicAuthHeader,
} from './lib/admin-auth';

export function middleware(request: NextRequest) {
  if (!getAdminCredentials()) {
    return new NextResponse(
      'Admin is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD in the environment.',
      { status: 503 },
    );
  }
  if (!verifyBasicAuthHeader(request.headers.get('authorization'))) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};
