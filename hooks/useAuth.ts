import { useState, useCallback } from 'react';
import { AuthTestForm, AuthResult } from '@/types/employee';

export const useAuth = () => {
  const [authTest, setAuthTest] = useState<AuthTestForm>({ 
    email: '', 
    password: '', 
    result: null 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 認証テスト
  const testAuthentication = useCallback(async () => {
    if (!authTest.email || !authTest.password) {
      setError('Email and password are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ldap/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authTest.email,
          password: authTest.password
        })
      });
      const data: AuthResult = await response.json();
      setAuthTest(prev => ({ ...prev, result: data }));
    } catch (error) {
      console.error('Authentication error:', error);
      const errorResult: AuthResult = { 
        success: false, 
        message: 'Authentication failed due to network error' 
      };
      setAuthTest(prev => ({ ...prev, result: errorResult }));
      setError('Network error during authentication');
    } finally {
      setLoading(false);
    }
  }, [authTest.email, authTest.password]);

  // 認証フォームの更新
  const updateAuthTest = useCallback((updates: Partial<AuthTestForm>) => {
    setAuthTest(prev => ({ ...prev, ...updates }));
    setError(null);
  }, []);

  // サンプルアカウントの設定
  const setAuthTestCredentials = useCallback((email: string, password: string) => {
    setAuthTest(prev => ({ ...prev, email, password }));
    setError(null);
  }, []);

  return {
    authTest,
    loading,
    error,
    testAuthentication,
    updateAuthTest,
    setAuthTestCredentials
  };
};