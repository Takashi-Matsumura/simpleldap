# ユーザーデータ構造とPostgreSQL実装

## 1. 現在のJSONデータ構造

### 1.1 全体構造

```json
{
  "users": {
    "[メールアドレス]": {
      "dn": "Distinguished Name",
      "password": "ハッシュ化されたパスワード",
      "attributes": {
        "LDAP属性": "値"
      }
    }
  },
  "config": {}
}
```

### 1.2 詳細な構造説明

#### トップレベル構造
- **`users`**: ユーザーデータのメインコンテナ
- **`config`**: 設定情報（現在は未使用）

#### ユーザーエントリ構造
各ユーザーエントリは **メールアドレスをキー** として以下の構造を持ちます：

```json
"admin@example.com": {
  "dn": "mail=admin@example.com,ou=users,dc=example,dc=com",
  "password": "$2b$10$agKdJCQgalTi4J1Ajg2P/OZ/tSoDBgle5EAEnB.RUcU3/Q7UFMIu.",
  "attributes": {
    "mail": "admin@example.com",
    "cn": "Administrator", 
    "givenName": "Admin",
    "sn": "User",
    "role": "admin",
    "objectClass": ["inetOrgPerson", "organizationalPerson", "person", "top"],
    "telephoneNumber": "123-456-7890"
  }
}
```

### 1.3 各フィールドの説明

#### `dn` (Distinguished Name)
- **形式**: `mail={email},ou=users,dc=example,dc=com`
- **用途**: LDAPでのユニークな識別子
- **例**: `mail=admin@example.com,ou=users,dc=example,dc=com`

#### `password`
- **形式**: bcryptハッシュ (saltRounds: 10)
- **例**: `$2b$10$agKdJCQgalTi4J1Ajg2P/OZ/tSoDBgle5EAEnB.RUcU3/Q7UFMIu.`
- **セキュリティ**: 平文パスワードは保存されない

#### `attributes`
LDAP標準属性とカスタム属性の組み合わせ：

| 属性名 | 説明 | 例 | 必須 |
|--------|------|-----|------|
| `mail` | メールアドレス | `admin@example.com` | ✅ |
| `cn` | Common Name (表示名) | `Administrator` | ✅ |
| `givenName` | 名 | `Admin` | ❌ |
| `sn` | Surname (姓) | `User` | ❌ |
| `role` | カスタムロール | `admin`, `user` | ❌ |
| `objectClass` | LDAPオブジェクトクラス | `["inetOrgPerson", ...]` | ✅ |
| `telephoneNumber` | 電話番号 | `123-456-7890` | ❌ |

## 2. PostgreSQL実装の可能性

### 2.1 実装可能性

**はい、PostgreSQL実装は完全に可能です！** 以下の方法で実装できます：

### 2.2 PostgreSQLテーブル設計案

#### 基本テーブル構造

```sql
-- ユーザーテーブル
CREATE TABLE ldap_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    dn TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ユーザー属性テーブル（EAVパターン）
CREATE TABLE ldap_user_attributes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES ldap_users(id) ON DELETE CASCADE,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- objectClass テーブル
CREATE TABLE ldap_object_classes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES ldap_users(id) ON DELETE CASCADE,
    object_class VARCHAR(100) NOT NULL
);

-- インデックス
CREATE INDEX idx_users_email ON ldap_users(email);
CREATE INDEX idx_attributes_user_id ON ldap_user_attributes(user_id);
CREATE INDEX idx_attributes_name ON ldap_user_attributes(attribute_name);
```

#### 正規化されたテーブル構造（推奨）

```sql
-- ユーザーテーブル（主要属性）
CREATE TABLE ldap_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    dn TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    cn VARCHAR(255) NOT NULL,
    given_name VARCHAR(100),
    surname VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    telephone_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- objectClassテーブル
CREATE TABLE ldap_object_classes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES ldap_users(id) ON DELETE CASCADE,
    object_class VARCHAR(100) NOT NULL,
    UNIQUE(user_id, object_class)
);

-- 追加属性テーブル（拡張用）
CREATE TABLE ldap_additional_attributes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES ldap_users(id) ON DELETE CASCADE,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value TEXT NOT NULL,
    UNIQUE(user_id, attribute_name)
);
```

### 2.3 PostgreSQL実装の利点

#### パフォーマンス
- **高速検索**: インデックス活用で大量ユーザーでも高速
- **並行性**: 複数接続の同時処理
- **スケーラビリティ**: 数万〜数十万ユーザーに対応

#### データ整合性
- **ACID特性**: トランザクション保証
- **制約**: 外部キー、ユニーク制約
- **バックアップ**: 堅牢なバックアップ・リストア機能

#### 高度な機能
- **フルテキスト検索**: PostgreSQL標準機能
- **JSON型**: 複雑な属性をJSON形式で保存
- **レプリケーション**: マスター・スレーブ構成

### 2.4 実装例

#### UserManager PostgreSQL版

```javascript
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

class PostgreSQLUserManager {
  constructor(config) {
    this.pool = new Pool({
      user: config.user || 'postgres',
      host: config.host || 'localhost',
      database: config.database || 'simpleldap',
      password: config.password,
      port: config.port || 5432,
    });
  }

  // ユーザー取得
  async getUserByEmail(email) {
    const userQuery = `
      SELECT * FROM ldap_users WHERE email = $1
    `;
    const objectClassQuery = `
      SELECT object_class FROM ldap_object_classes 
      WHERE user_id = $1
    `;

    const userResult = await this.pool.query(userQuery, [email]);
    if (userResult.rows.length === 0) return null;

    const user = userResult.rows[0];
    const objectClassResult = await this.pool.query(objectClassQuery, [user.id]);
    
    return {
      dn: user.dn,
      password: user.password_hash,
      attributes: {
        mail: user.email,
        cn: user.cn,
        givenName: user.given_name,
        sn: user.surname,
        role: user.role,
        telephoneNumber: user.telephone_number,
        objectClass: objectClassResult.rows.map(row => row.object_class)
      }
    };
  }

  // ユーザー追加
  async addUser(email, password, attributes) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // パスワードハッシュ化
      const hashedPassword = await bcrypt.hash(password, 10);
      const dn = `mail=${email},ou=users,dc=example,dc=com`;

      // ユーザー挿入
      const userInsert = `
        INSERT INTO ldap_users (email, dn, password_hash, cn, given_name, surname, role, telephone_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;
      
      const userResult = await client.query(userInsert, [
        email,
        dn,
        hashedPassword,
        attributes.cn || email.split('@')[0],
        attributes.givenName,
        attributes.sn,
        attributes.role || 'user',
        attributes.telephoneNumber
      ]);

      const userId = userResult.rows[0].id;

      // objectClass挿入
      const objectClasses = attributes.objectClass || 
        ['inetOrgPerson', 'organizationalPerson', 'person', 'top'];
      
      for (const objectClass of objectClasses) {
        await client.query(
          'INSERT INTO ldap_object_classes (user_id, object_class) VALUES ($1, $2)',
          [userId, objectClass]
        );
      }

      await client.query('COMMIT');
      return await this.getUserByEmail(email);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 認証
  async authenticateUser(email, password) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
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
  }
}
```

### 2.5 移行戦略

#### 段階的移行アプローチ

1. **フェーズ1**: PostgreSQL環境セットアップ
2. **フェーズ2**: データベーススキーマ作成
3. **フェーズ3**: 既存JSONデータの移行
4. **フェーズ4**: UserManager PostgreSQL版実装
5. **フェーズ5**: テスト・検証
6. **フェーズ6**: 本番切り替え

#### 移行スクリプト例

```javascript
// JSON to PostgreSQL migration script
async function migrateFromJSON(jsonFilePath, pgUserManager) {
  const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
  
  for (const [email, userData] of Object.entries(jsonData.users)) {
    try {
      await pgUserManager.addUser(email, 'migrated-password', userData.attributes);
      console.log(`✓ Migrated user: ${email}`);
    } catch (error) {
      console.error(`❌ Failed to migrate ${email}:`, error.message);
    }
  }
}
```

## 3. JSON vs PostgreSQL 比較

| 項目 | JSON実装 | PostgreSQL実装 |
|------|----------|----------------|
| **セットアップ** | 簡単 | 中程度 |
| **パフォーマンス** | 小規模: 良好<br>大規模: 劣化 | 常に高速 |
| **データ整合性** | 低い | 高い |
| **並行性** | 低い | 高い |
| **バックアップ** | ファイルコピー | 専用ツール |
| **スケーラビリティ** | 制限あり | 優秀 |
| **開発速度** | 高速 | 中程度 |
| **運用コスト** | 低い | 中程度 |

## 4. 推奨事項

### 4.1 用途別推奨

- **学習・プロトタイプ**: JSON実装
- **小規模テスト環境**: JSON実装
- **中〜大規模環境**: PostgreSQL実装
- **本番環境**: PostgreSQL実装

### 4.2 移行タイミング

以下の条件で移行を検討：

- ユーザー数が1000人を超える
- 同時接続数が10を超える
- データ整合性が重要
- 高可用性が必要

## 5. まとめ

現在のJSON実装は学習・テスト目的には最適ですが、PostgreSQL実装により以下が実現できます：

- **高パフォーマンス**: 大規模ユーザー対応
- **データ整合性**: ACID特性による安全性
- **拡張性**: 複雑な検索・レポート機能
- **運用性**: バックアップ・監視・メンテナンス機能

PostgreSQL実装は完全に実現可能で、既存のアーキテクチャを維持しながら段階的に移行できます。