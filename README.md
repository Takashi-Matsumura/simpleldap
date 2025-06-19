# 🔐 SimpleLDAP - Test Environment

SimpleLDAPは、メールアドレスとパスワードによる認証機能を備えたテスト用LDAP環境です。Next.jsとldapjsを使用して構築され、WebUIでの管理機能も提供します。

## 📋 概要

このプロジェクトは、LDAP認証の学習・検証を目的として作成されたシンプルなLDAP実装です。本格的なLDAPサーバーの代替として、開発・テスト環境での認証機能検証に最適です。

### 🌟 主な機能

- **📧 メールアドレス認証**: メールアドレスとパスワードによるLDAP認証
- **🌐 Web管理画面**: ユーザー管理のためのNext.js WebUI
- **🧪 リアルタイム認証テスト**: WebUI上での認証機能テスト
- **👥 ユーザー管理**: ユーザーの追加・削除・更新機能
- **🔒 パスワードハッシュ化**: bcryptによる安全なパスワード保存
- **📊 統計表示**: ユーザー数やロール別統計の表示

## 🚀 クイックスタート

### 前提条件

- Node.js 18.17以上
- npm または yarn

### インストールと起動

```bash
# リポジトリのクローン
git clone <repository-url>
cd simpleldap

# 依存関係のインストール
npm install

# 初期ユーザーデータの作成
npm run init-users

# 開発サーバーの起動
npm run dev
```

Webブラウザで http://localhost:3000 (または表示されたポート) にアクセスしてください。

## 🔑 デフォルトテストアカウント

プロジェクトには以下のテストアカウントが含まれています：

| ロール | メールアドレス | パスワード |
|--------|--------------|-----------|
| Admin  | admin@example.com | admin123 |
| User   | user@example.com | user123 |
| Test   | test@example.com | test123 |

## 📁 プロジェクト構造

```
simpleldap/
├── app/                          # Next.js App Router
│   ├── api/ldap/                # LDAP API Routes
│   │   ├── auth/route.js        # 認証API
│   │   ├── users/route.js       # ユーザー管理API
│   │   └── server/route.js      # サーバー状態API
│   ├── page.tsx                 # メイン管理画面
│   └── layout.tsx               # レイアウト
├── lib/                         # コアライブラリ
│   ├── user-manager.js          # ユーザー管理クラス
│   ├── ldap-server.js           # LDAP サーバー実装
│   └── ldap-client.js           # LDAP クライアント実装
├── scripts/                     # ユーティリティスクリプト
│   ├── init-users.js            # 初期ユーザー作成
│   ├── start-ldap-server.js     # LDAPサーバー起動
│   └── test-auth.js             # 認証テスト
├── data/                        # データストレージ
│   └── users.json               # ユーザーデータ
└── output/                      # 調査・ドキュメント
    ├── LDAP調査レポート.md
    ├── LDAP認証テスト環境の実現可能性.md
    └── LDAPユーザー情報の保存方法.md
```

## 🛠️ 利用可能なスクリプト

### 開発用コマンド

```bash
# Next.js 開発サーバーの起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバーの起動
npm run start

# ESLint実行
npm run lint
```

### LDAP関連コマンド

```bash
# 初期ユーザーデータの作成（既存ユーザーはスキップ）
npm run init-users

# 初期ユーザーデータの強制リセット・再作成
npm run init-users-force

# スタンドアロンLDAPサーバーの起動
npm run ldap-server

# コマンドライン認証テスト
npm run test-auth

# ユーザー検索テスト
npm run test-auth search
```

## 🌐 WebUI機能詳細

### 管理画面 (`/`)

- **📊 ダッシュボード**: ユーザー統計（総数、管理者数、一般ユーザー数）
- **🧪 認証テスト**: リアルタイムでの認証機能テスト
- **➕ ユーザー追加**: 新規ユーザーの作成
- **👥 ユーザー一覧**: 全ユーザーの表示と削除

### API エンドポイント

#### ユーザー管理
- `GET /api/ldap/users` - 全ユーザー取得
- `POST /api/ldap/users` - ユーザー作成
- `GET /api/ldap/users/[email]` - 特定ユーザー取得
- `PUT /api/ldap/users/[email]` - ユーザー更新
- `DELETE /api/ldap/users/[email]` - ユーザー削除

#### 認証
- `POST /api/ldap/auth` - 認証テスト

#### サーバー管理
- `GET /api/ldap/server` - サーバー状態取得
- `POST /api/ldap/server` - サーバー制御

## 🔧 技術スタック

### フロントエンド
- **Next.js 15.3.4** - React フレームワーク
- **React 19.0.0** - UIライブラリ
- **Tailwind CSS v4** - CSSフレームワーク
- **TypeScript** - 型安全性

### バックエンド
- **Node.js** - サーバーサイドランタイム
- **ldapjs 3.0.7** - LDAP プロトコル実装
- **bcrypt** - パスワードハッシュ化
- **Next.js API Routes** - RESTful API

### データストレージ
- **JSON ファイル** - 軽量データ永続化

## 📚 LDAP実装詳細

### 認証フロー

1. **WebUI認証**: ブラウザ → API Routes → UserManager
2. **LDAP認証**: LDAPクライアント → LDAPサーバー → UserManager
3. **DN形式**: `mail={email},ou=users,dc=example,dc=com`

### データ形式

```json
{
  "users": {
    "user@example.com": {
      "dn": "mail=user@example.com,ou=users,dc=example,dc=com",
      "password": "$2b$10$hashedpassword...",
      "attributes": {
        "mail": "user@example.com",
        "cn": "User Name",
        "givenName": "User",
        "sn": "Name",
        "telephoneNumber": "123-456-7890",
        "role": "user",
        "objectClass": ["inetOrgPerson", "organizationalPerson", "person", "top"]
      }
    }
  }
}
```

### サポートするLDAP操作

- **Bind**: 認証
- **Search**: ユーザー検索
- **Add**: ユーザー追加
- **Modify**: ユーザー更新
- **Delete**: ユーザー削除

## 🔒 セキュリティ

- **パスワードハッシュ化**: bcrypt (saltRounds: 10)
- **入力検証**: メールアドレス形式、必須フィールドチェック
- **LDAP接続**: ローカルホスト限定 (127.0.0.1:3389)

## 🧪 テスト

### 認証テスト例

```bash
# 成功例
npm run test-auth
# → admin@example.com / admin123 で認証成功

# 失敗例  
# → 間違ったパスワードで認証失敗
```

### ユーザー検索テスト

```bash
npm run test-auth search
# → 全ユーザー検索と特定ユーザー検索を実行
```

## 📝 注意事項

### 本番利用について

⚠️ **このプロジェクトはテスト・学習目的のみです**
- 本番環境での使用は推奨しません
- パフォーマンスは限定的です
- セキュリティは基本的なレベルです

### 制限事項

- **同時接続数**: 限定的
- **データサイズ**: 小〜中規模想定
- **LDAP準拠**: 基本機能のみ実装
- **暗号化**: LDAPS未実装

## 🤝 貢献

このプロジェクトは学習・検証目的で作成されました。改善提案やバグ報告は歓迎します。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🔗 関連リンク

- [LDAP調査レポート](./output/LDAP調査レポート.md)
- [LDAP認証テスト環境の実現可能性](./output/LDAP認証テスト環境の実現可能性.md)
- [LDAPユーザー情報の保存方法](./output/LDAPユーザー情報の保存方法.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [ldapjs Documentation](https://ldapjs.org/)

---

**SimpleLDAP** - Simple LDAP Test Environment for Learning and Development