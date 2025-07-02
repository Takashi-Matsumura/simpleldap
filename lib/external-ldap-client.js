// eslint-disable-next-line @typescript-eslint/no-require-imports
const ldap = require('ldapjs');

class ExternalLDAPClient {
  constructor(options = {}) {
    this.host = options.host || '';
    this.port = options.port || '';
    this.baseDN = options.baseDN || '';
    this.loginAttribute = options.loginAttribute || '';
    this.client = null;
    this.isConnected = false;
    
    // 完全なURLを構築
    if (this.host && this.port) {
      this.url = this.host.includes('://') ? 
        `${this.host}:${this.port}` : 
        `ldap://${this.host}:${this.port}`;
    } else {
      this.url = '';
    }
  }

  // クライアントの作成
  createClient() {
    this.client = ldap.createClient({
      url: this.url,
      timeout: 10000,        // 10秒タイムアウト
      connectTimeout: 10000, // 10秒接続タイムアウト
      reconnect: false       // 自動再接続を無効
    });

    // エラーハンドリング
    this.client.on('error', (err) => {
      console.error('External LDAP Client Error:', err);
      this.isConnected = false;
    });

    // 接続終了の処理
    this.client.on('close', () => {
      console.log('External LDAP Client connection closed');
      this.isConnected = false;
    });

    // 接続成功の処理
    this.client.on('connect', () => {
      console.log('External LDAP Client connected');
      this.isConnected = true;
    });

    return this.client;
  }

  // 接続テスト
  async testConnection() {
    return new Promise((resolve) => {
      try {
        if (!this.client) {
          this.createClient();
        }

        console.log(`🔗 Testing connection to: ${this.url}`);
        console.log(`📍 Base DN: ${this.baseDN}`);

        // 匿名バインドで接続テスト
        this.client.bind('', '', (err) => {
          if (err) {
            console.log(`❌ Connection test failed: ${err.message}`);
            resolve({
              success: false,
              message: `Connection failed: ${err.message}`,
              url: this.url,
              baseDN: this.baseDN
            });
          } else {
            console.log(`✅ Connection test successful: ${this.url}`);
            resolve({
              success: true,
              message: 'Connection successful',
              url: this.url,
              baseDN: this.baseDN
            });
          }
        });
      } catch (error) {
        console.error('Connection test error:', error);
        resolve({
          success: false,
          message: `Connection error: ${error.message}`,
          url: this.url,
          baseDN: this.baseDN
        });
      }
    });
  }

  // ユーザー名とパスワードで認証（uid属性使用）
  async authenticate(username, password) {
    return new Promise((resolve) => {
      try {
        if (!this.client) {
          this.createClient();
        }

        // DNの構築（uid属性を使用）
        const dn = `${this.loginAttribute}=${username},${this.baseDN}`;
        
        console.log(`🔐 Attempting to authenticate: ${username}`);
        console.log(`📍 Using DN: ${dn}`);
        console.log(`🏠 Server: ${this.url}`);

        // bind操作で認証
        this.client.bind(dn, password, (err) => {
          if (err) {
            console.log(`❌ Authentication failed: ${err.message}`);
            resolve({
              success: false,
              message: this.formatErrorMessage(err.message),
              username: username,
              dn: dn,
              server: this.url
            });
          } else {
            console.log(`✅ Authentication successful: ${username}`);
            this.isConnected = true;
            resolve({
              success: true,
              message: 'Authentication successful',
              username: username,
              dn: dn,
              server: this.url
            });
          }
        });
      } catch (error) {
        console.error('Authentication error:', error);
        resolve({
          success: false,
          message: `Authentication error: ${error.message}`,
          username: username,
          server: this.url
        });
      }
    });
  }

  // ユーザー検索（認証後）
  async searchUser(username, attributes = []) {
    return new Promise((resolve) => {
      try {
        if (!this.client) {
          this.createClient();
        }

        const filter = `(${this.loginAttribute}=${username})`;
        const options = {
          filter: filter,
          scope: 'sub',
          attributes: attributes.length > 0 ? attributes : ['cn', 'uid', 'mail', 'givenName', 'sn', 'telephoneNumber', 'ou', 'title']
        };

        console.log(`🔍 Searching for user: ${username}`);
        console.log(`📍 Filter: ${filter}`);
        console.log(`🏠 Base DN: ${this.baseDN}`);

        this.client.search(this.baseDN, options, (err, searchRes) => {
          if (err) {
            console.error(`❌ Search failed: ${err.message}`);
            resolve({
              success: false,
              message: err.message,
              users: []
            });
            return;
          }

          const users = [];

          searchRes.on('searchEntry', (entry) => {
            const user = {
              dn: entry.dn.toString(),
              attributes: entry.object
            };
            users.push(user);
            console.log(`📄 Found user: ${entry.dn.toString()}`);
          });

          searchRes.on('error', (err) => {
            console.error(`❌ Search error: ${err.message}`);
            resolve({
              success: false,
              message: err.message,
              users: []
            });
          });

          searchRes.on('end', () => {
            console.log(`✅ Search completed. Found ${users.length} users`);
            resolve({
              success: true,
              message: `Found ${users.length} users`,
              users: users
            });
          });
        });
      } catch (error) {
        console.error('Search error:', error);
        resolve({
          success: false,
          message: error.message,
          users: []
        });
      }
    });
  }

  // 認証とユーザー情報取得を組み合わせたメソッド
  async authenticateAndGetUser(username, password) {
    try {
      // 認証を試行
      const authResult = await this.authenticate(username, password);
      
      if (!authResult.success) {
        return authResult;
      }

      // 認証成功時にユーザー情報を取得
      const searchResult = await this.searchUser(username);
      
      if (searchResult.success && searchResult.users.length > 0) {
        return {
          success: true,
          message: 'Authentication and user retrieval successful',
          username: username,
          dn: authResult.dn,
          server: authResult.server,
          user: searchResult.users[0]
        };
      } else {
        return {
          success: true,
          message: 'Authentication successful but user details not found',
          username: username,
          dn: authResult.dn,
          server: authResult.server,
          user: null
        };
      }
    } catch (error) {
      console.error('Authenticate and get user error:', error);
      return {
        success: false,
        message: error.message,
        username: username,
        server: this.url
      };
    }
  }

  // エラーメッセージのフォーマット
  formatErrorMessage(message) {
    if (message.includes('Invalid Credentials')) {
      return 'Invalid username or password';
    }
    if (message.includes('ECONNREFUSED')) {
      return 'Cannot connect to LDAP server. Please check the server address and port.';
    }
    if (message.includes('ENOTFOUND')) {
      return 'LDAP server not found. Please check the hostname.';
    }
    if (message.includes('ETIMEDOUT')) {
      return 'Connection timeout. Please check the server address and network connection.';
    }
    return message;
  }

  // 接続の切断
  disconnect() {
    if (this.client && this.isConnected) {
      this.client.unbind(() => {
        console.log('🔌 External LDAP Client disconnected');
        this.isConnected = false;
      });
    }
  }

  // 接続状態の取得
  getStatus() {
    return {
      isConnected: this.isConnected,
      url: this.url,
      host: this.host,
      port: this.port,
      baseDN: this.baseDN,
      loginAttribute: this.loginAttribute
    };
  }

  // 設定の更新
  updateSettings(options) {
    this.host = options.host || this.host;
    this.port = options.port || this.port;
    this.baseDN = options.baseDN || this.baseDN;
    this.loginAttribute = options.loginAttribute || this.loginAttribute;
    
    // URLを再構築
    if (this.host && this.port) {
      this.url = this.host.includes('://') ? 
        `${this.host}:${this.port}` : 
        `ldap://${this.host}:${this.port}`;
    } else {
      this.url = '';
    }
    
    // 既存の接続をクリア
    if (this.client) {
      this.disconnect();
      this.client = null;
    }
  }
}

module.exports = ExternalLDAPClient;