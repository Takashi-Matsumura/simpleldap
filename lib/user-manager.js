// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt');

class UserManager {
  constructor(dataPath = path.join(process.cwd(), 'data', 'users.json')) {
    this.dataPath = dataPath;
    this.data = this.loadData();
  }

  // データファイルの読み込み
  loadData() {
    try {
      if (!fs.existsSync(this.dataPath)) {
        console.warn(`Data file not found: ${this.dataPath}`);
        return { users: {}, config: {} };
      }
      const rawData = fs.readFileSync(this.dataPath, 'utf8');
      return JSON.parse(rawData);
    } catch (error) {
      console.error('Error loading user data:', error);
      return { users: {}, config: {} };
    }
  }

  // データファイルの保存
  saveData() {
    try {
      const dir = path.dirname(this.dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      return false;
    }
  }

  // パスワードのハッシュ化
  async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  // パスワードの検証
  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // 全ユーザーの取得
  getAllUsers() {
    return this.data.users || {};
  }

  // メールアドレスでユーザーを取得
  getUserByEmail(email) {
    return this.data.users[email] || null;
  }

  // DN（Distinguished Name）でユーザーを取得
  getUserByDN(dn) {
    const users = this.data.users;
    for (const email in users) {
      if (users[email].dn === dn) {
        return users[email];
      }
    }
    return null;
  }

  // ユーザーの追加
  async addUser(email, password, attributes = {}) {
    try {
      // 既存ユーザーのチェック
      if (this.data.users[email]) {
        throw new Error('User already exists');
      }

      // パスワードのハッシュ化
      const hashedPassword = await this.hashPassword(password);

      // DN（Distinguished Name）の生成
      const dn = `mail=${email},ou=users,dc=example,dc=com`;

      // デフォルト属性の設定
      const defaultAttributes = {
        mail: email,
        cn: attributes.cn || email.split('@')[0],
        givenName: attributes.givenName || '',
        sn: attributes.sn || '',
        role: attributes.role || 'user',
        objectClass: ['inetOrgPerson', 'organizationalPerson', 'person', 'top']
      };

      // 新しいユーザーオブジェクトの作成
      this.data.users[email] = {
        dn: dn,
        password: hashedPassword,
        attributes: { ...defaultAttributes, ...attributes }
      };

      // データの保存
      if (this.saveData()) {
        return this.data.users[email];
      } else {
        throw new Error('Failed to save user data');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  // ユーザーの更新
  async updateUser(email, updates) {
    try {
      const user = this.data.users[email];
      if (!user) {
        throw new Error('User not found');
      }

      // パスワードの更新（提供された場合）
      if (updates.password) {
        updates.password = await this.hashPassword(updates.password);
      }

      // 属性の更新
      if (updates.attributes) {
        user.attributes = { ...user.attributes, ...updates.attributes };
        delete updates.attributes;
      }

      // その他のフィールドの更新
      Object.assign(user, updates);

      // データの保存
      if (this.saveData()) {
        return user;
      } else {
        throw new Error('Failed to save user data');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // ユーザーの削除
  deleteUser(email) {
    try {
      if (!this.data.users[email]) {
        throw new Error('User not found');
      }

      delete this.data.users[email];

      if (this.saveData()) {
        return true;
      } else {
        throw new Error('Failed to save user data');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // ユーザー認証
  async authenticateUser(email, password) {
    try {
      const user = this.getUserByEmail(email);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const isValidPassword = await this.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return { success: false, message: 'Invalid password' };
      }

      return {
        success: true,
        message: 'Authentication successful',
        user: {
          email: email,
          dn: user.dn,
          attributes: user.attributes
        }
      };
    } catch (error) {
      console.error('Error authenticating user:', error);
      return { success: false, message: 'Authentication error' };
    }
  }

  // DN認証（LDAP bind用）
  async authenticateByDN(dn, password) {
    try {
      const user = this.getUserByDN(dn);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const isValidPassword = await this.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return { success: false, message: 'Invalid credentials' };
      }

      return {
        success: true,
        message: 'Authentication successful',
        user: {
          dn: user.dn,
          attributes: user.attributes
        }
      };
    } catch (error) {
      console.error('Error authenticating by DN:', error);
      return { success: false, message: 'Authentication error' };
    }
  }

  // ユーザー検索（LDAP search用）
  searchUsers(filter = {}, attributes = []) {
    try {
      const users = this.data.users;
      const results = [];

      for (const email in users) {
        const user = users[email];
        let match = true;

        // フィルターの適用
        for (const key in filter) {
          if (key === 'mail' && email !== filter[key]) {
            match = false;
            break;
          }
          if (key in user.attributes && user.attributes[key] !== filter[key]) {
            match = false;
            break;
          }
        }

        if (match) {
          const result = {
            dn: user.dn,
            attributes: {}
          };

          // 指定された属性のみを返す（指定がない場合は全属性）
          if (attributes.length > 0) {
            attributes.forEach(attr => {
              if (attr === 'mail') {
                result.attributes[attr] = email;
              } else if (attr in user.attributes) {
                result.attributes[attr] = user.attributes[attr];
              }
            });
          } else {
            result.attributes = { mail: email, ...user.attributes };
          }

          results.push(result);
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // 設定の取得
  getConfig() {
    return this.data.config || {};
  }

  // 統計情報の取得
  getStats() {
    const users = this.data.users || {};
    const userCount = Object.keys(users).length;
    const adminCount = Object.values(users).filter(user => 
      user.attributes.role === 'admin'
    ).length;

    return {
      totalUsers: userCount,
      adminUsers: adminCount,
      regularUsers: userCount - adminCount
    };
  }
}

module.exports = UserManager;