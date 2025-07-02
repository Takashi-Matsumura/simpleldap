import { createApiResponse, createErrorResponse, validateRequired, ApiError } from '../../../../lib/api-utils';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ExternalLDAPClient = require('../../../../lib/external-ldap-client');

// POST: 外部OpenLDAPサーバーでの認証テスト
export async function POST(request) {
  try {
    const data = await request.json();
    
    // 入力値検証
    validateRequired(data, ['username', 'password', 'host', 'port', 'baseDN', 'loginAttribute']);
    
    const { 
      username, 
      password, 
      host,
      port,
      baseDN,
      loginAttribute
    } = data;

    console.log(`🔐 External LDAP Authentication Request:`);
    console.log(`   Username: ${username}`);
    console.log(`   Host: ${host}`);
    console.log(`   Port: ${port}`);
    console.log(`   Base DN: ${baseDN}`);
    console.log(`   Login Attribute: ${loginAttribute}`);

    // 外部LDAPクライアントを作成
    const ldapClient = new ExternalLDAPClient({
      host,
      port,
      baseDN,
      loginAttribute
    });

    try {
      // 認証とユーザー情報取得を実行
      const result = await ldapClient.authenticateAndGetUser(username, password);
      
      if (result.success) {
        console.log(`✅ External LDAP authentication successful for: ${username}`);
        
        return createApiResponse(true, {
          message: result.message,
          user: result.user,
          server: {
            url: result.server,
            dn: result.dn,
            baseDN: baseDN,
            loginAttribute: loginAttribute
          }
        });
      } else {
        console.log(`❌ External LDAP authentication failed for: ${username} - ${result.message}`);
        throw new ApiError(result.message, 401);
      }
    } catch (authError) {
      console.error('External LDAP authentication error:', authError);
      throw new ApiError(`Authentication failed: ${authError.message}`, 401);
    } finally {
      // 接続をクリーンアップ
      ldapClient.disconnect();
    }
  } catch (error) {
    console.error('External LDAP API error:', error);
    return createErrorResponse(error);
  }
}

// GET: 外部LDAPサーバーへの接続テスト
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const host = searchParams.get('host');
    const port = parseInt(searchParams.get('port'));
    const baseDN = searchParams.get('baseDN');
    const loginAttribute = searchParams.get('loginAttribute');

    // 必須パラメータの確認
    if (!host || !port || !baseDN || !loginAttribute) {
      throw new ApiError('Host, port, baseDN, and loginAttribute are required parameters', 400);
    }

    console.log(`🔗 External LDAP Connection Test:`);
    console.log(`   Host: ${host}`);
    console.log(`   Port: ${port}`);
    console.log(`   Base DN: ${baseDN}`);
    console.log(`   Login Attribute: ${loginAttribute}`);

    // 外部LDAPクライアントを作成
    const ldapClient = new ExternalLDAPClient({
      host,
      port,
      baseDN,
      loginAttribute
    });

    try {
      // 接続テストを実行
      const result = await ldapClient.testConnection();
      
      if (result.success) {
        console.log(`✅ External LDAP connection test successful`);
        return createApiResponse(true, {
          message: result.message,
          server: {
            url: result.url,
            baseDN: result.baseDN,
            loginAttribute: loginAttribute,
            status: 'connected'
          }
        });
      } else {
        console.log(`❌ External LDAP connection test failed: ${result.message}`);
        throw new ApiError(result.message, 503);
      }
    } catch (connectionError) {
      console.error('External LDAP connection error:', connectionError);
      throw new ApiError(`Connection failed: ${connectionError.message}`, 503);
    } finally {
      // 接続をクリーンアップ
      ldapClient.disconnect();
    }
  } catch (error) {
    console.error('External LDAP connection test API error:', error);
    return createErrorResponse(error);
  }
}