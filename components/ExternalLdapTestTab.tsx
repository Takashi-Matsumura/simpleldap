'use client';

import React from 'react';
import { useExternalLdap } from '@/hooks/useExternalLdap';

export const ExternalLdapTestTab: React.FC = () => {
  const {
    config,
    auth,
    loading,
    connectionTesting,
    error,
    authResult,
    connectionResult,
    updateConfig,
    updateAuth,
    testConnection,
    testAuthentication,
    resetConfig,
    clearAuth,
    clearResults,
    isConfigValid
  } = useExternalLdap();

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">🌐 External OpenLDAP Server Test</h2>
        <p className="text-gray-600">Connect and test authentication with your company&apos;s OpenLDAP server</p>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LDAP サーバー設定 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">🔧 LDAP Server Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Host URL
              </label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => updateConfig({ host: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ldap://your-ldap-server.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port
              </label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => updateConfig({ port: parseInt(e.target.value) || '' })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter port number (e.g., 389, 636)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base DN
              </label>
              <input
                type="text"
                value={config.baseDN}
                onChange={(e) => updateConfig({ baseDN: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ou=Users,dc=example,dc=com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Login Attribute
              </label>
              <input
                type="text"
                value={config.loginAttribute}
                onChange={(e) => updateConfig({ loginAttribute: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter login attribute (e.g., uid, cn, mail)"
              />
            </div>

            {/* 設定ボタン */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={testConnection}
                disabled={connectionTesting || !isConfigValid()}
                className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {connectionTesting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Testing Connection...
                  </>
                ) : (
                  '🔗 Test Connection'
                )}
              </button>
              <button
                onClick={resetConfig}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                🔄 Reset
              </button>
            </div>
          </div>

          {/* 接続テスト結果 */}
          {connectionResult && (
            <div className={`mt-4 p-4 rounded-lg ${connectionResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <strong>{connectionResult.success ? '✅ Connection Successful' : '❌ Connection Failed'}</strong>
              <p className="mt-1">{connectionResult.message}</p>
              {connectionResult.server && (
                <div className="mt-3 text-sm">
                  <p><strong>Server URL:</strong> {connectionResult.server.url}</p>
                  <p><strong>Base DN:</strong> {connectionResult.server.baseDN}</p>
                  <p><strong>Login Attribute:</strong> {connectionResult.server.loginAttribute}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 認証テスト */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">🔐 Authentication Test</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={auth.username}
                onChange={(e) => updateAuth({ username: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={auth.password}
                onChange={(e) => updateAuth({ password: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            {/* 認証ボタン */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={testAuthentication}
                disabled={loading || !auth.username || !auth.password || !isConfigValid()}
                className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </>
                ) : (
                  '🚀 Test Authentication'
                )}
              </button>
              <button
                onClick={clearAuth}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                🗑️ Clear
              </button>
            </div>
          </div>

          {/* 認証結果 */}
          {authResult && (
            <div className={`mt-4 p-4 rounded-lg ${authResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <strong>{authResult.success ? '✅ Authentication Successful' : '❌ Authentication Failed'}</strong>
              <p className="mt-1">{authResult.message}</p>
              
              {authResult.success && authResult.user && (
                <div className="mt-3 text-sm">
                  <p><strong>Distinguished Name:</strong> {authResult.user.dn}</p>
                  {authResult.user.attributes && (
                    <div className="mt-2">
                      <p><strong>User Attributes:</strong></p>
                      <div className="ml-4 mt-1">
                        {authResult.user.attributes.cn && (
                          <p><strong>Common Name:</strong> {authResult.user.attributes.cn}</p>
                        )}
                        {authResult.user.attributes.uid && (
                          <p><strong>User ID:</strong> {authResult.user.attributes.uid}</p>
                        )}
                        {authResult.user.attributes.mail && (
                          <p><strong>Email:</strong> {authResult.user.attributes.mail}</p>
                        )}
                        {authResult.user.attributes.givenName && (
                          <p><strong>Given Name:</strong> {authResult.user.attributes.givenName}</p>
                        )}
                        {authResult.user.attributes.sn && (
                          <p><strong>Surname:</strong> {authResult.user.attributes.sn}</p>
                        )}
                        {authResult.user.attributes.ou && (
                          <p><strong>Organizational Unit:</strong> {authResult.user.attributes.ou}</p>
                        )}
                        {authResult.user.attributes.title && (
                          <p><strong>Title:</strong> {authResult.user.attributes.title}</p>
                        )}
                        {authResult.user.attributes.telephoneNumber && (
                          <p><strong>Phone:</strong> {authResult.user.attributes.telephoneNumber}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {authResult.server && (
                <div className="mt-3 text-sm border-t border-green-200 pt-3">
                  <p><strong>Server Information:</strong></p>
                  <div className="ml-4 mt-1">
                    <p><strong>Server URL:</strong> {authResult.server.url}</p>
                    <p><strong>User DN:</strong> {authResult.server.dn}</p>
                    <p><strong>Base DN:</strong> {authResult.server.baseDN}</p>
                    <p><strong>Login Attribute:</strong> {authResult.server.loginAttribute}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* クリアボタン */}
      {(authResult || connectionResult) && (
        <div className="flex justify-center">
          <button
            onClick={clearResults}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
          >
            🗑️ Clear All Results
          </button>
        </div>
      )}

      {/* 使用方法の説明 */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 How to Use</h3>
        <div className="text-blue-800 space-y-2">
          <p><strong>1. Configure Server Settings:</strong> Enter your OpenLDAP server details</p>
          <p><strong>2. Test Connection:</strong> Verify that the server is reachable</p>
          <p><strong>3. Enter Credentials:</strong> Input your username and password</p>
          <p><strong>4. Test Authentication:</strong> Verify that your credentials are valid</p>
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 rounded text-sm text-blue-700">
          <p><strong>Example Configuration:</strong></p>
          <p>• Host: ldap://your-ldap-server.com</p>
          <p>• Port: 389 (LDAP) or 636 (LDAPS)</p>
          <p>• Base DN: ou=Users,dc=example,dc=com</p>
          <p>• Login Attribute: uid, cn, mail, sAMAccountName, etc.</p>
        </div>
      </div>
    </div>
  );
};