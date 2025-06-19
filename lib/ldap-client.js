const ldap = require('ldapjs');

class SimpleLDAPClient {
  constructor(options = {}) {
    this.url = options.url || 'ldap://127.0.0.1:3389';
    this.baseDN = options.baseDN || 'dc=example,dc=com';
    this.usersDN = options.usersDN || 'ou=users,dc=example,dc=com';
    this.client = null;
    this.isConnected = false;
  }

  // クライアントの作成
  createClient() {
    this.client = ldap.createClient({
      url: this.url,
      timeout: 5000,
      connectTimeout: 5000
    });

    // エラーハンドリング
    this.client.on('error', (err) => {
      console.error('LDAP Client Error:', err);
      this.isConnected = false;
    });

    // 接続終了の処理
    this.client.on('close', () => {
      console.log('LDAP Client connection closed');
      this.isConnected = false;
    });

    return this.client;
  }

  // メールアドレスとパスワードで認証
  async authenticate(email, password) {
    return new Promise((resolve) => {
      try {
        if (!this.client) {
          this.createClient();
        }

        // DNの構築
        const dn = `mail=${email},${this.usersDN}`;
        
        console.log(`🔐 Attempting to authenticate: ${email}`);
        console.log(`📍 Using DN: ${dn}`);

        // bind操作で認証
        this.client.bind(dn, password, (err) => {
          if (err) {
            console.log(`❌ Authentication failed: ${err.message}`);
            resolve({
              success: false,
              message: err.message,
              email: email,
              dn: dn
            });
          } else {
            console.log(`✅ Authentication successful: ${email}`);
            this.isConnected = true;
            resolve({
              success: true,
              message: 'Authentication successful',
              email: email,
              dn: dn
            });
          }
        });
      } catch (error) {
        console.error('Authentication error:', error);
        resolve({
          success: false,
          message: error.message,
          email: email
        });
      }
    });
  }

  // ユーザー検索
  async searchUser(email, attributes = []) {
    return new Promise((resolve) => {
      try {
        if (!this.client) {
          this.createClient();
        }

        const filter = `(mail=${email})`;
        const options = {
          filter: filter,
          scope: 'sub',
          attributes: attributes.length > 0 ? attributes : ['mail', 'cn', 'givenName', 'sn', 'telephoneNumber', 'role']
        };

        console.log(`🔍 Searching for user: ${email}`);
        console.log(`📍 Filter: ${filter}`);

        this.client.search(this.usersDN, options, (err, searchRes) => {
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

          searchRes.on('end', (result) => {
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

  // 全ユーザー検索
  async searchAllUsers(attributes = []) {
    return new Promise((resolve) => {
      try {
        if (!this.client) {
          this.createClient();
        }

        const filter = '(objectClass=inetOrgPerson)';
        const options = {
          filter: filter,
          scope: 'sub',
          attributes: attributes.length > 0 ? attributes : ['mail', 'cn', 'givenName', 'sn', 'telephoneNumber', 'role']
        };

        console.log(`🔍 Searching for all users`);
        console.log(`📍 Filter: ${filter}`);

        this.client.search(this.usersDN, options, (err, searchRes) => {
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
            console.log(`📄 Found user: ${entry.object.mail || entry.dn.toString()}`);
          });

          searchRes.on('error', (err) => {
            console.error(`❌ Search error: ${err.message}`);
            resolve({
              success: false,
              message: err.message,
              users: []
            });
          });

          searchRes.on('end', (result) => {
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
  async authenticateAndGetUser(email, password) {
    try {
      // 認証を試行
      const authResult = await this.authenticate(email, password);
      
      if (!authResult.success) {
        return authResult;
      }

      // 認証成功時にユーザー情報を取得
      const searchResult = await this.searchUser(email);
      
      if (searchResult.success && searchResult.users.length > 0) {
        return {
          success: true,
          message: 'Authentication and user retrieval successful',
          email: email,
          dn: authResult.dn,
          user: searchResult.users[0]
        };
      } else {
        return {
          success: true,
          message: 'Authentication successful but user details not found',
          email: email,
          dn: authResult.dn,
          user: null
        };
      }
    } catch (error) {
      console.error('Authenticate and get user error:', error);
      return {
        success: false,
        message: error.message,
        email: email
      };
    }
  }

  // 接続の切断
  disconnect() {
    if (this.client && this.isConnected) {
      this.client.unbind(() => {
        console.log('🔌 LDAP Client disconnected');
        this.isConnected = false;
      });
    }
  }

  // 接続状態の取得
  getStatus() {
    return {
      isConnected: this.isConnected,
      url: this.url,
      baseDN: this.baseDN,
      usersDN: this.usersDN
    };
  }
}

module.exports = SimpleLDAPClient;