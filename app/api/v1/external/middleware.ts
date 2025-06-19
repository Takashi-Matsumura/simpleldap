import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { createApiErrorResponse } from '@/lib/external-api-utils';

// 外部API共通ミドルウェア
export async function middleware(request: NextRequest) {
  // プリフライトリクエストの処理
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'X-API-Key, Authorization, Content-Type');
    response.headers.set('Access-Control-Max-Age', '86400');
    return response;
  }
  
  // 認証チェック
  const authResult = authenticateRequest(request);
  
  if (!authResult.authenticated) {
    return createApiErrorResponse(
      'UNAUTHORIZED',
      authResult.error || 'Authentication required',
      401,
      authResult
    );
  }
  
  // 認証情報をヘッダーに追加して次の処理へ
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-Client-Name', authResult.clientName || 'Unknown');
  
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  return response;
}

// ミドルウェアを適用するパス
export const config = {
  matcher: '/api/v1/external/:path*',
};