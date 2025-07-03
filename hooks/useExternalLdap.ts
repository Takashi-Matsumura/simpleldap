import { useState, useCallback } from 'react';

interface ExternalLdapConfig {
  host: string;
  port: number | '';
  baseDN: string;
  loginAttribute: string;
}

interface ExternalLdapAuth {
  username: string;
  password: string;
}

interface AuthResult {
  success: boolean;
  message: string;
  user?: {
    dn: string;
    attributes: Record<string, any>;
  };
  server?: {
    url: string;
    dn: string;
    baseDN: string;
    loginAttribute: string;
  };
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
  server?: {
    url: string;
    baseDN: string;
    loginAttribute: string;
    status: string;
  };
}

export const useExternalLdap = () => {
  // LDAP サーバー設定
  const [config, setConfig] = useState<ExternalLdapConfig>({
    host: '',
    port: '',
    baseDN: '',
    loginAttribute: ''
  });

  // 認証情報
  const [auth, setAuth] = useState<ExternalLdapAuth>({
    username: '',
    password: ''
  });

  // 状態管理
  const [loading, setLoading] = useState(false);
  const [connectionTesting, setConnectionTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authResult, setAuthResult] = useState<AuthResult | null>(null);
  const [connectionResult, setConnectionResult] = useState<ConnectionTestResult | null>(null);

  // 設定の更新
  const updateConfig = useCallback((updates: Partial<ExternalLdapConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setError(null);
    setAuthResult(null);
    setConnectionResult(null);
  }, []);

  // 認証情報の更新
  const updateAuth = useCallback((updates: Partial<ExternalLdapAuth>) => {
    setAuth(prev => ({ ...prev, ...updates }));
    setError(null);
  }, []);

  // 接続テスト
  const testConnection = useCallback(async () => {
    setConnectionTesting(true);
    setError(null);
    setConnectionResult(null);

    try {
      const params = new URLSearchParams({
        host: config.host,
        port: config.port.toString(),
        baseDN: config.baseDN,
        loginAttribute: config.loginAttribute
      });

      const response = await fetch(`/api/ldap/external-auth?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setConnectionResult({
          success: true,
          message: data.message || 'Connection successful',
          server: data.server
        });
      } else {
        throw new Error(data.error?.message || 'Connection test failed');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error during connection test';
      setError(errorMessage);
      setConnectionResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setConnectionTesting(false);
    }
  }, [config]);

  // 認証テスト
  const testAuthentication = useCallback(async () => {
    if (!auth.username || !auth.password) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);
    setError(null);
    setAuthResult(null);

    try {
      const response = await fetch('/api/ldap/external-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: auth.username,
          password: auth.password,
          host: config.host,
          port: config.port,
          baseDN: config.baseDN,
          loginAttribute: config.loginAttribute
        })
      });

      const data = await response.json();

      if (data.success) {
        setAuthResult({
          success: true,
          message: data.message || 'Authentication successful',
          user: data.user,
          server: data.server
        });
      } else {
        const errorMessage = data.error?.message || 'Authentication failed';
        setAuthResult({
          success: false,
          message: errorMessage
        });
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error during authentication';
      setAuthResult({
        success: false,
        message: errorMessage
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [auth, config]);

  // 設定のリセット（デフォルト値に戻す）
  const resetConfig = useCallback(() => {
    setConfig({
      host: '',
      port: '',
      baseDN: '',
      loginAttribute: ''
    });
    setError(null);
    setAuthResult(null);
    setConnectionResult(null);
  }, []);

  // 認証情報のクリア
  const clearAuth = useCallback(() => {
    setAuth({ username: '', password: '' });
    setError(null);
    setAuthResult(null);
  }, []);

  // すべての結果をクリア
  const clearResults = useCallback(() => {
    setError(null);
    setAuthResult(null);
    setConnectionResult(null);
  }, []);

  // 設定の妥当性チェック
  const isConfigValid = useCallback(() => {
    return config.host.trim() !== '' && 
           config.port !== '' && 
           Number(config.port) > 0 && 
           config.baseDN.trim() !== '' && 
           config.loginAttribute.trim() !== '';
  }, [config]);

  return {
    // 状態
    config,
    auth,
    loading,
    connectionTesting,
    error,
    authResult,
    connectionResult,
    
    // アクション
    updateConfig,
    updateAuth,
    testConnection,
    testAuthentication,
    resetConfig,
    clearAuth,
    clearResults,
    
    // ヘルパー
    isConfigValid
  };
};