/**
 * API-specific type definitions
 */

export interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  params?: Record<string, string>;
}

export interface FetchOptions extends RequestInit {
  timeout?: number;
}