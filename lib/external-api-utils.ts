// 外部API用のユーティリティ関数

import { NextResponse } from 'next/server';
import { ApiAuthResult, setRateLimitHeaders } from './api-auth';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

// 成功レスポンスの作成
export function createApiSuccessResponse<T>(
  data: T,
  authResult?: ApiAuthResult
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
  };
  
  const nextResponse = NextResponse.json(response);
  
  // レート制限ヘッダーを設定
  if (authResult) {
    setRateLimitHeaders(nextResponse.headers, authResult);
  }
  
  // CORSヘッダー
  nextResponse.headers.set('Access-Control-Allow-Origin', '*');
  nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  nextResponse.headers.set('Access-Control-Allow-Headers', 'X-API-Key, Authorization, Content-Type');
  
  return nextResponse;
}

// エラーレスポンスの作成
export function createApiErrorResponse(
  code: string,
  message: string,
  status: number = 400,
  authResult?: ApiAuthResult
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
  };
  
  const nextResponse = NextResponse.json(response, { status });
  
  // レート制限ヘッダーを設定
  if (authResult) {
    setRateLimitHeaders(nextResponse.headers, authResult);
  }
  
  // CORSヘッダー
  nextResponse.headers.set('Access-Control-Allow-Origin', '*');
  nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  nextResponse.headers.set('Access-Control-Allow-Headers', 'X-API-Key, Authorization, Content-Type');
  
  return nextResponse;
}

// センシティブ情報をフィルタリング
export function filterSensitiveData(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(item => filterSensitiveData(item));
  }
  
  if (data && typeof data === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtered = { ...data } as any;
    
    // センシティブなフィールドを削除
    delete filtered.password;
    delete filtered.dn;
    delete filtered.objectClass;
    delete filtered.costCenter;
    
    // ネストされたオブジェクトも処理
    for (const key in filtered) {
      if (filtered[key] && typeof filtered[key] === 'object') {
        filtered[key] = filterSensitiveData(filtered[key]);
      }
    }
    
    return filtered;
  }
  
  return data;
}

// ページネーション情報の計算
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function calculatePagination(
  total: number,
  page: number = 1,
  limit: number = 10
): PaginationInfo {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

// クエリパラメータのパース
export function parseQueryParams(url: string) {
  const { searchParams } = new URL(url);
  
  return {
    // ページネーション
    page: parseInt(searchParams.get('page') || '1'),
    limit: Math.min(parseInt(searchParams.get('limit') || '10'), 100), // 最大100件
    
    // フィルタリング
    department: searchParams.get('department'),
    division: searchParams.get('division'),
    title: searchParams.get('title'),
    employeeType: searchParams.get('employeeType'),
    role: searchParams.get('role'),
    
    // 検索
    search: searchParams.get('search') || searchParams.get('q'),
    
    // ソート
    sortBy: searchParams.get('sortBy') || 'name',
    sortOrder: (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc',
    
    // フィールド選択
    fields: searchParams.get('fields')?.split(',').filter(Boolean)
  };
}