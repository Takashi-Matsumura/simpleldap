/**
 * Centralized error handling utilities for MCP Server
 */

export class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleToolError(error: unknown, context: string): string {
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('not found') || error.message.includes('404')) {
      return `❌ エラー: ${context}が見つかりませんでした\n\n💡 **ヒント**: 指定された情報が正しいか確認してください。`;
    }
    
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return `❌ エラー: 認証エラー - APIキーが無効か期限切れです\n\n💡 **ヒント**: SimpleLDAPサーバーの設定を確認してください。`;
    }
    
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return `❌ エラー: レート制限に達しました\n\n💡 **ヒント**: しばらく待ってから再度お試しください。`;
    }
    
    if (error.message.includes('timeout')) {
      return `❌ エラー: リクエストがタイムアウトしました\n\n💡 **ヒント**: ネットワーク接続を確認するか、SimpleLDAPサーバーが起動しているか確認してください。`;
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      return `❌ エラー: SimpleLDAPサーバーに接続できません\n\n💡 **ヒント**: SimpleLDAPサーバーが起動していることを確認してください。`;
    }
    
    // Generic error with context
    return `❌ エラー: ${context}中にエラーが発生しました - ${error.message}`;
  }
  
  return '❌ エラー: 予期しないエラーが発生しました';
}

export function formatApiError(status: number, message?: string): string {
  const errorMessages: Record<number, string> = {
    400: 'リクエストが不正です',
    401: '認証に失敗しました',
    403: 'アクセスが拒否されました',
    404: 'リソースが見つかりません',
    429: 'レート制限に達しました',
    500: 'サーバーエラーが発生しました',
    503: 'サービスが一時的に利用できません'
  };
  
  const baseMessage = errorMessages[status] || `HTTPエラー ${status}`;
  return message ? `${baseMessage}: ${message}` : baseMessage;
}