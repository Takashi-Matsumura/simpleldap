import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const sampleAccounts = [
  { email: 'ceo@company.com', password: 'ceo123', name: '田中社長', role: 'CEO' },
  { email: 'sales.director@company.com', password: 'sales123', name: '佐藤営業部長', role: 'Sales Director' },
  { email: 'hr.manager@company.com', password: 'hr123', name: '鈴木人事部長', role: 'HR Manager' },
  { email: 'it.manager@company.com', password: 'it123', name: '高橋IT部長', role: 'IT Manager' }
];

export const AuthTestTab: React.FC = () => {
  const { authTest, loading, error, testAuthentication, updateAuthTest, setAuthTestCredentials } = useAuth();

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Authentication Test</h2>
        <p className="text-gray-600">Test LDAP authentication with employee credentials</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 認証テスト */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">🔐 Test Authentication</h3>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={authTest.email}
              onChange={(e) => updateAuthTest({ email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={authTest.password}
              onChange={(e) => updateAuthTest({ password: e.target.value })}
            />
            <button
              onClick={testAuthentication}
              disabled={loading}
              className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
            >
              {loading ? 'Testing...' : 'Test Authentication'}
            </button>
            {authTest.result && (
              <div className={`p-4 rounded-lg ${authTest.result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <strong>{authTest.result.success ? '✅ Authentication Successful' : '❌ Authentication Failed'}</strong>
                <p className="mt-1">{authTest.result.message}</p>
                {authTest.result.user && (
                  <div className="mt-3 text-sm">
                    <p><strong>Name:</strong> {authTest.result.user.attributes?.cn}</p>
                    <p><strong>Role:</strong> {authTest.result.user.attributes?.role}</p>
                    {authTest.result.user.attributes?.department && (
                      <p><strong>Department:</strong> {authTest.result.user.attributes.department}</p>
                    )}
                    {authTest.result.user.attributes?.title && (
                      <p><strong>Title:</strong> {authTest.result.user.attributes.title}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* サンプルアカウント */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">👨‍💼 Sample Accounts</h3>
          <div className="space-y-3">
            {sampleAccounts.map((account, index) => (
              <div 
                key={index} 
                className="bg-white p-3 rounded border cursor-pointer hover:bg-blue-50"
                onClick={() => setAuthTestCredentials(account.email, account.password)}
              >
                <div className="font-medium text-sm">{account.role}</div>
                <div className="text-xs text-gray-600">{account.email} / {account.password}</div>
                <div className="text-xs text-gray-500">{account.name}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-blue-700">
            💡 Click on any account to auto-fill the form above
          </div>
        </div>
      </div>
    </div>
  );
};