import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 外部APIパスの場合は認証をスキップ
  if (request.nextUrl.pathname.startsWith('/api/v1/external')) {
    return NextResponse.next();
  }
  
  // その他のパスはそのまま通す
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - /api/v1/external (external API routes)
     * - _next/static (static files) 
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/v1/external|_next/static|_next/image|favicon.ico).*)',
  ],
}