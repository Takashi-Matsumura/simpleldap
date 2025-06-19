const ldap = require('ldapjs');
const UserManager = require('./user-manager');

class SimpleLDAPServer {
  constructor(options = {}) {
    this.port = options.port || 3389; // 非特権ポート
    this.baseDN = options.baseDN || 'dc=example,dc=com';
    this.usersDN = options.usersDN || 'ou=users,dc=example,dc=com';
    this.userManager = new UserManager();
    this.server = null;
    this.isRunning = false;
  }

  // サーバーの作成と設定
  createServer() {
    this.server = ldap.createServer({
      log: {
        name: 'SimpleLDAPServer',
        level: 'info'
      }
    });

    // Bind操作の処理（認証）
    this.server.bind(this.usersDN, this.handleBind.bind(this));
    this.server.bind(this.baseDN, this.handleBind.bind(this));

    // Search操作の処理（ユーザー検索）
    this.server.search(this.usersDN, this.handleSearch.bind(this));
    this.server.search(this.baseDN, this.handleSearch.bind(this));

    // Add操作の処理（ユーザー追加）
    this.server.add(this.usersDN, this.handleAdd.bind(this));

    // Modify操作の処理（ユーザー更新）
    this.server.modify(this.usersDN, this.handleModify.bind(this));

    // Delete操作の処理（ユーザー削除）
    this.server.del(this.usersDN, this.handleDelete.bind(this));

    // エラーハンドリング
    this.server.on('error', (err) => {
      console.error('LDAP Server Error:', err);
    });

    return this.server;
  }

  // Bind操作の処理（認証）
  async handleBind(req, res, next) {
    try {
      const dn = req.dn.toString();
      const password = req.credentials;

      console.log(`🔐 LDAP Bind Request: ${dn}`);

      // DN形式の検証
      if (!dn.includes('mail=')) {
        console.log('❌ Invalid DN format');
        return next(new ldap.InvalidCredentialsError('Invalid DN format'));
      }

      // DN認証
      const authResult = await this.userManager.authenticateByDN(dn, password);
      
      if (authResult.success) {
        console.log(`✅ Authentication successful for: ${dn}`);
        res.end();
      } else {
        console.log(`❌ Authentication failed for: ${dn} - ${authResult.message}`);
        return next(new ldap.InvalidCredentialsError(authResult.message));
      }
    } catch (error) {
      console.error('Bind error:', error);
      return next(new ldap.OperationsError('Internal server error'));
    }
  }

  // Search操作の処理（ユーザー検索）
  async handleSearch(req, res, next) {
    try {
      const baseDN = req.dn.toString();
      const scope = req.scope;
      const filter = req.filter.toString();
      const attributes = req.attributes;

      console.log(`🔍 LDAP Search Request:`);
      console.log(`   Base DN: ${baseDN}`);
      console.log(`   Scope: ${scope}`);
      console.log(`   Filter: ${filter}`);
      console.log(`   Attributes: ${attributes}`);

      // フィルターの解析
      const searchFilter = this.parseFilter(filter);
      
      // ユーザー検索
      const users = this.userManager.searchUsers(searchFilter, attributes);

      console.log(`📋 Found ${users.length} users matching filter`);

      // 結果の送信
      users.forEach(user => {
        const entry = {
          dn: user.dn,
          attributes: user.attributes
        };
        
        console.log(`   📄 Returning user: ${user.dn}`);
        res.send(entry);
      });

      res.end();
    } catch (error) {
      console.error('Search error:', error);
      return next(new ldap.OperationsError('Search failed'));
    }
  }

  // Add操作の処理（ユーザー追加）
  async handleAdd(req, res, next) {
    try {
      const dn = req.dn.toString();
      const attributes = req.toObject().attributes;

      console.log(`➕ LDAP Add Request: ${dn}`);
      console.log(`   Attributes:`, attributes);

      // DNからメールアドレスを抽出
      const email = this.extractEmailFromDN(dn);
      if (!email) {
        return next(new ldap.InvalidDnSyntaxError('Invalid DN format'));
      }

      // パスワードの取得
      const password = attributes.userPassword?.[0];
      if (!password) {
        return next(new ldap.ConstraintViolationError('Password required'));
      }

      // ユーザーの追加
      await this.userManager.addUser(email, password, attributes);

      console.log(`✅ User added successfully: ${email}`);
      res.end();
    } catch (error) {
      console.error('Add error:', error);
      if (error.message === 'User already exists') {
        return next(new ldap.EntryAlreadyExistsError('User already exists'));
      }
      return next(new ldap.OperationsError('Add failed'));
    }
  }

  // Modify操作の処理（ユーザー更新）
  async handleModify(req, res, next) {
    try {
      const dn = req.dn.toString();
      const changes = req.changes;

      console.log(`✏️ LDAP Modify Request: ${dn}`);
      console.log(`   Changes:`, changes);

      // DNからメールアドレスを抽出
      const email = this.extractEmailFromDN(dn);
      if (!email) {
        return next(new ldap.InvalidDnSyntaxError('Invalid DN format'));
      }

      // 変更内容の処理
      const updates = { attributes: {} };
      changes.forEach(change => {
        if (change.modification.type === 'userPassword') {
          updates.password = change.modification.vals[0];
        } else {
          updates.attributes[change.modification.type] = change.modification.vals[0];
        }
      });

      // ユーザーの更新
      await this.userManager.updateUser(email, updates);

      console.log(`✅ User modified successfully: ${email}`);
      res.end();
    } catch (error) {
      console.error('Modify error:', error);
      if (error.message === 'User not found') {
        return next(new ldap.NoSuchObjectError('User not found'));
      }
      return next(new ldap.OperationsError('Modify failed'));
    }
  }

  // Delete操作の処理（ユーザー削除）
  async handleDelete(req, res, next) {
    try {
      const dn = req.dn.toString();

      console.log(`🗑️ LDAP Delete Request: ${dn}`);

      // DNからメールアドレスを抽出
      const email = this.extractEmailFromDN(dn);
      if (!email) {
        return next(new ldap.InvalidDnSyntaxError('Invalid DN format'));
      }

      // ユーザーの削除
      this.userManager.deleteUser(email);

      console.log(`✅ User deleted successfully: ${email}`);
      res.end();
    } catch (error) {
      console.error('Delete error:', error);
      if (error.message === 'User not found') {
        return next(new ldap.NoSuchObjectError('User not found'));
      }
      return next(new ldap.OperationsError('Delete failed'));
    }
  }

  // フィルターの解析
  parseFilter(filterString) {
    const filter = {};
    
    // 基本的なフィルター形式の解析: (attribute=value)
    const match = filterString.match(/\\(([^=]+)=([^)]+)\\)/);
    if (match) {
      const attribute = match[1];
      const value = match[2];
      
      // ワイルドカード（*）の処理
      if (value !== '*') {
        filter[attribute] = value;
      }
    }

    return filter;
  }

  // DNからメールアドレスを抽出
  extractEmailFromDN(dn) {
    const match = dn.match(/mail=([^,]+)/);
    return match ? match[1] : null;
  }

  // サーバーの開始
  async start() {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        resolve();
        return;
      }

      if (!this.server) {
        this.createServer();
      }

      this.server.listen(this.port, '127.0.0.1', (err) => {
        if (err) {
          console.error(`❌ Failed to start LDAP server: ${err.message}`);
          reject(err);
        } else {
          this.isRunning = true;
          console.log(`🚀 LDAP Server started on port ${this.port}`);
          console.log(`📍 Base DN: ${this.baseDN}`);
          console.log(`👥 Users DN: ${this.usersDN}`);
          
          // 統計情報の表示
          const stats = this.userManager.getStats();
          console.log(`📊 Loaded ${stats.totalUsers} users (${stats.adminUsers} admins, ${stats.regularUsers} regular)`);
          
          resolve();
        }
      });
    });
  }

  // サーバーの停止
  async stop() {
    return new Promise((resolve) => {
      if (!this.isRunning || !this.server) {
        resolve();
        return;
      }

      this.server.close(() => {
        this.isRunning = false;
        console.log('🛑 LDAP Server stopped');
        resolve();
      });
    });
  }

  // サーバーの状態取得
  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      baseDN: this.baseDN,
      usersDN: this.usersDN,
      userStats: this.userManager.getStats()
    };
  }
}

module.exports = SimpleLDAPServer;