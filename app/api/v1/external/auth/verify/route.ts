import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { createApiSuccessResponse, createApiErrorResponse, filterSensitiveData } from '@/lib/external-api-utils';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const UserManager = require('@/lib/user-manager');

const userManager = new UserManager();

// POST: 認証確認
export async function POST(request: NextRequest) {
  // API認証
  const authResult = authenticateRequest(request);
  if (!authResult.authenticated) {
    return createApiErrorResponse(
      'UNAUTHORIZED',
      authResult.error || 'Authentication required',
      401,
      authResult
    );
  }
  
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return createApiErrorResponse(
        'VALIDATION_ERROR',
        'Email and password are required',
        400,
        authResult
      );
    }
    
    // ユーザー認証
    const result = await userManager.authenticateUser(email, password);
    
    if (result.success) {
      // センシティブ情報をフィルタリング
      const filteredUser = filterSensitiveData(result.user) as typeof result.user;
      
      return createApiSuccessResponse({
        authenticated: true,
        employee: {
          email: filteredUser.email,
          name: filteredUser.attributes?.cn,
          employeeNumber: filteredUser.attributes?.employeeNumber,
          department: filteredUser.attributes?.department,
          division: filteredUser.attributes?.division,
          title: filteredUser.attributes?.title,
          employeeType: filteredUser.attributes?.employeeType,
          role: filteredUser.attributes?.role
        }
      }, authResult);
    } else {
      return createApiSuccessResponse({
        authenticated: false,
        message: result.message
      }, authResult);
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return createApiErrorResponse(
      'INTERNAL_ERROR',
      'An error occurred during authentication',
      500,
      authResult
    );
  }
}

// OPTIONS: CORS対応
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'X-API-Key, Authorization, Content-Type');
  return response;
}