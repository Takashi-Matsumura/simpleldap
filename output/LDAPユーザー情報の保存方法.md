# LDAPユーザー情報の保存方法

## 1. 一般的なLDAPサーバーでのデータ保存

### 1.1 本格的なLDAPサーバーの場合
**OpenLDAP、Active Directory等**では、以下のような場所にデータが保存されます：

#### OpenLDAP
- **Berkeley DB (BDB)** または **Lightning MDB (LMDB)** データベース
- ファイルシステム上のデータベースファイル
- 例: `/var/lib/ldap/` ディレクトリ内

#### Microsoft Active Directory
- **Extensible Storage Engine (ESE)** データベース
- `ntds.dit` ファイル（通常は `C:\Windows\NTDS\`）

### 1.2 データの形式
- **LDIF** (LDAP Data Interchange Format) 形式でインポート/エクスポート
- バイナリデータベース内では最適化された形で保存

## 2. ldapjsでのデータ保存オプション

### 2.1 メモリ保存（開発・テスト用）
最もシンプルな方法で、JavaScriptオブジェクトとして保存：

```javascript
// メモリ内のユーザーデータ
const users = {
  'user1@example.com': {
    dn: 'mail=user1@example.com,ou=users,dc=example,dc=com',
    password: 'password123', // 実際にはハッシュ化すべき
    attributes: {
      mail: 'user1@example.com',
      cn: 'User One',
      givenName: 'User',
      sn: 'One',
      telephoneNumber: '123-456-7890'
    }
  },
  'user2@example.com': {
    dn: 'mail=user2@example.com,ou=users,dc=example,dc=com',
    password: 'securepass456',
    attributes: {
      mail: 'user2@example.com',
      cn: 'User Two',
      givenName: 'User',
      sn: 'Two'
    }
  }
};
```

### 2.2 JSONファイル保存
永続化が必要な場合：

```javascript
const fs = require('fs');
const path = require('path');

// データファイルのパス
const dataFile = path.join(__dirname, 'data', 'users.json');

// データの読み込み
function loadUsers() {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {}; // ファイルが存在しない場合は空オブジェクト
  }
}

// データの保存
function saveUsers(users) {
  const dir = path.dirname(dataFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));
}

// 使用例
let users = loadUsers();

// ユーザー追加
users['newuser@example.com'] = {
  dn: 'mail=newuser@example.com,ou=users,dc=example,dc=com',
  password: 'hashedpassword',
  attributes: {
    mail: 'newuser@example.com',
    cn: 'New User'
  }
};

saveUsers(users);
```

### 2.3 データベース連携（本格的な実装）
より本格的な実装では、以下のデータベースと連携：

#### SQLite（軽量）
```javascript
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('ldap-users.db');

// テーブル作成
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    dn TEXT NOT NULL,
    attributes TEXT NOT NULL
  )`);
});

// ユーザー取得
function getUser(email, callback) {
  db.get("SELECT * FROM users WHERE email = ?", [email], callback);
}
```

#### MongoDB（NoSQL）
```javascript
const { MongoClient } = require('mongodb');

// ユーザードキュメントの例
const userDocument = {
  _id: ObjectId(),
  email: 'user@example.com',
  password: 'hashedpassword',
  dn: 'mail=user@example.com,ou=users,dc=example,dc=com',
  attributes: {
    cn: 'User Name',
    givenName: 'User',
    sn: 'Name',
    telephoneNumber: '123-456-7890'
  },
  createdAt: new Date(),
  updatedAt: new Date()
};
```

## 3. パスワードの安全な保存

### 3.1 ハッシュ化（必須）
```javascript
const bcrypt = require('bcrypt');

// パスワードのハッシュ化
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// パスワードの検証
async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// 使用例
const users = {
  'user@example.com': {
    dn: 'mail=user@example.com,ou=users,dc=example,dc=com',
    password: '$2b$10$...', // bcryptでハッシュ化されたパスワード
    attributes: { /* ... */ }
  }
};
```

### 3.2 LDAP標準のパスワードハッシュ
```javascript
const crypto = require('crypto');

// SSHA（Salted SHA-1）形式
function createSSHAPassword(password) {
  const salt = crypto.randomBytes(4);
  const hash = crypto.createHash('sha1');
  hash.update(password);
  hash.update(salt);
  const digest = hash.digest();
  
  const combined = Buffer.concat([digest, salt]);
  return '{SSHA}' + combined.toString('base64');
}
```

## 4. 推奨する実装方針

### 4.1 テスト環境向け（このプロジェクト）
```javascript
// data/users.json
{
  "users": {
    "admin@example.com": {
      "dn": "mail=admin@example.com,ou=users,dc=example,dc=com",
      "password": "$2b$10$hashedpassword...",
      "attributes": {
        "mail": "admin@example.com",
        "cn": "Administrator",
        "givenName": "Admin",
        "sn": "User",
        "role": "admin"
      }
    },
    "user@example.com": {
      "dn": "mail=user@example.com,ou=users,dc=example,dc=com",
      "password": "$2b$10$hashedpassword...",
      "attributes": {
        "mail": "user@example.com",
        "cn": "Regular User",
        "givenName": "Regular",
        "sn": "User",
        "role": "user"
      }
    }
  }
}
```

### 4.2 ファイル構造案
```
/data/
  ├── users.json          # ユーザーデータ
  ├── groups.json         # グループデータ（オプション）
  └── config.json         # LDAP設定
```

### 4.3 データ管理用のユーティリティ
```javascript
// lib/user-manager.js
class UserManager {
  constructor(dataPath) {
    this.dataPath = dataPath;
    this.users = this.loadUsers();
  }

  loadUsers() { /* JSONファイルから読み込み */ }
  saveUsers() { /* JSONファイルに保存 */ }
  
  async addUser(email, password, attributes) { /* ユーザー追加 */ }
  async updateUser(email, updates) { /* ユーザー更新 */ }
  async deleteUser(email) { /* ユーザー削除 */ }
  async authenticateUser(email, password) { /* 認証 */ }
}
```

## まとめ

**このプロジェクトでは以下の方針を推奨します：**

1. **開発・テスト段階**: JSONファイル保存
2. **パスワード**: bcryptでハッシュ化
3. **データ構造**: LDAP標準に準拠
4. **管理**: WebUIでのCRUD操作

この方法により、軽量でありながら実用的なLDAPテスト環境を構築できます。