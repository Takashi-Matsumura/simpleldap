// 外部API認証とレート制限のユーティリティ

import { NextRequest } from 'next/server';

interface ApiKeyConfig {
  name: string;
  rateLimit: number;
}

// APIキーの管理（本番環境では環境変数から読み込む）
const VALID_API_KEYS = new Map<string, ApiKeyConfig>([
  ['test-api-key-1', { name: 'Test Client 1', rateLimit: 1000 }],
  ['test-api-key-2', { name: 'Test Client 2', rateLimit: 500 }],
  // 環境変数から追加のキーを読み込む
  ...(process.env.API_KEYS ? JSON.parse(process.env.API_KEYS) : [])
]);

// レート制限の追跡（本番環境ではRedisなどを使用）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface ApiAuthResult {
  authenticated: boolean;
  clientName?: string;
  error?: string;
  rateLimitRemaining?: number;
}

// APIキー認証
export function authenticateApiKey(request: NextRequest): ApiAuthResult {
  const apiKey = request.headers.get('X-API-Key');
  
  if (!apiKey) {
    return {
      authenticated: false,
      error: 'API key is required. Please provide X-API-Key header.'
    };
  }
  
  const client = VALID_API_KEYS.get(apiKey);
  if (!client) {
    return {
      authenticated: false,
      error: 'Invalid API key'
    };
  }
  
  // レート制限チェック
  const now = Date.now();
  const rateLimitKey = `${apiKey}:${Math.floor(now / 3600000)}`; // 1時間単位
  const rateLimit = rateLimitStore.get(rateLimitKey) || { count: 0, resetTime: now + 3600000 };
  
  if (rateLimit.count >= client.rateLimit) {
    return {
      authenticated: false,
      error: `Rate limit exceeded. Limit: ${client.rateLimit} requests per hour`,
      rateLimitRemaining: 0
    };
  }
  
  // レート制限カウンタを更新
  rateLimit.count++;
  rateLimitStore.set(rateLimitKey, rateLimit);
  
  // 古いエントリをクリーンアップ
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
  
  return {
    authenticated: true,
    clientName: client.name,
    rateLimitRemaining: client.rateLimit - rateLimit.count
  };
}

// Bearer Token認証（JWT）
export function authenticateBearerToken(request: NextRequest): ApiAuthResult {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: 'Bearer token is required'
    };
  }
  
  const token = authHeader.substring(7);
  
  // TODO: JWT検証の実装
  // 現在は簡易実装
  if (token === 'test-bearer-token') {
    return {
      authenticated: true,
      clientName: 'Bearer Token Client'
    };
  }
  
  return {
    authenticated: false,
    error: 'Invalid bearer token'
  };
}

// 統合認証関数
export function authenticateRequest(request: NextRequest): ApiAuthResult {
  // APIキー認証を優先
  const apiKeyAuth = authenticateApiKey(request);
  if (apiKeyAuth.authenticated || request.headers.get('X-API-Key')) {
    return apiKeyAuth;
  }
  
  // Bearer Token認証にフォールバック
  return authenticateBearerToken(request);
}

// レスポンスヘッダーの設定
export function setRateLimitHeaders(headers: Headers, authResult: ApiAuthResult) {
  if (authResult.rateLimitRemaining !== undefined) {
    headers.set('X-RateLimit-Remaining', authResult.rateLimitRemaining.toString());
    headers.set('X-RateLimit-Reset', new Date(Date.now() + 3600000).toISOString());
  }
}