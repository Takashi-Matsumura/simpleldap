# 🔐 SimpleLDAP - Employee Management System

SimpleLDAPは、LDAP認証と包括的な社員情報管理機能を備えた、モダンなWebベースの従業員管理システムです。Next.js 15とTypeScriptで構築され、企業の人事管理や認証システムの検証に最適です。

## 📋 概要

このプロジェクトは、LDAP認証の学習・検証から始まり、実用的な社員管理システムへと進化しました。認証機能だけでなく、組織構造の可視化、部署管理、社員情報の包括的な管理が可能です。

### 🌟 主な機能

#### 認証・セキュリティ
- **📧 メールアドレス認証**: メールアドレスとパスワードによるLDAP認証
- **🔒 セキュアなパスワード管理**: bcryptによるハッシュ化
- **🧪 認証テスト環境**: リアルタイムでの認証機能検証

#### 社員管理
- **👥 包括的な社員情報管理**: 基本情報、連絡先、所属、雇用形態など
- **➕ 社員の追加・削除**: 直感的なUIでの社員データ管理
- **📋 社員一覧表示**: ソート可能な表形式での表示
- **🏷️ 役職・権限管理**: システム管理者、管理者、一般社員の3段階

#### 組織管理
- **🏢 組織構造の可視化**: 部門・部署別の階層表示
- **👑 管理階層ツリー**: 上司・部下関係の視覚的表示
- **📊 部署別統計**: 人数、平均勤続年数などの分析
- **📈 組織統計ダッシュボード**: 全社規模の統計情報

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

# 社員データの初期化（推奨）
npm run init-company-users

# または、基本ユーザーデータの作成
npm run init-users

# 開発サーバーの起動
npm run dev
```

Webブラウザで http://localhost:3000 (または表示されたポート) にアクセスしてください。

## 🔑 テストアカウント

### 社員サンプルアカウント（推奨）

| ロール | メールアドレス | パスワード | 氏名・役職 |
|--------|--------------|-----------|------------|
| CEO | ceo@company.com | ceo123 | 田中社長（代表取締役社長） |
| Sales Director | sales.director@company.com | sales123 | 佐藤営業部長（営業部） |
| HR Manager | hr.manager@company.com | hr123 | 鈴木人事部長（人事部） |
| IT Manager | it.manager@company.com | it123 | 高橋IT部長（IT部） |
| Sales Staff | tanaka.sales@company.com | tanaka123 | 田中営業課長（営業部） |
| Developer | dev.lead@company.com | dev123 | 伊藤開発リーダー（IT部） |

### 基本テストアカウント

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
│   │   ├── departments/route.js # 部署統計API
│   │   ├── organization/route.js # 組織構造API
│   │   └── server/route.js      # サーバー状態API
│   ├── page.tsx                 # メインページ（リファクタリング済み）
│   └── layout.tsx               # レイアウト
├── components/                  # Reactコンポーネント（新規追加）
│   ├── AuthTestTab.tsx          # 認証テストタブ
│   ├── EmployeeForm.tsx         # 社員追加フォーム
│   ├── EmployeeTable.tsx        # 社員一覧テーブル
│   ├── OrganizationTab.tsx      # 組織管理タブ
│   ├── StatsCards.tsx           # 統計カード
│   └── TabNavigation.tsx        # タブナビゲーション
├── hooks/                       # カスタムフック（新規追加）
│   ├── useAuth.ts               # 認証ロジック
│   ├── useEmployees.ts          # 社員管理ロジック
│   └── useOrganization.ts       # 組織管理ロジック
├── types/                       # TypeScript型定義（新規追加）
│   └── employee.ts              # 社員関連の型定義
├── lib/                         # コアライブラリ
│   ├── user-manager.js          # ユーザー管理クラス
│   ├── ldap-server.js           # LDAP サーバー実装
│   ├── ldap-client.js           # LDAP クライアント実装
│   └── api-utils.js             # API共通ユーティリティ（新規追加）
├── scripts/                     # ユーティリティスクリプト
│   ├── init-company-users.js    # 社員データ初期化（新規追加）
│   ├── init-users.js            # 基本ユーザー作成
│   ├── start-ldap-server.js     # LDAPサーバー起動
│   └── test-auth.js             # 認証テスト
├── data/                        # データストレージ
│   └── users.json               # ユーザーデータ
└── output/                      # 調査・ドキュメント
    ├── LDAP調査レポート.md
    ├── LDAP認証テスト環境の実現可能性.md
    ├── LDAPユーザー情報の保存方法.md
    └── 社員情報属性の追加方法.md
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
# 社員データの初期化（既存ユーザーはスキップ）
npm run init-company-users

# 社員データの強制リセット・再作成
npm run init-company-users-force

# 基本ユーザーデータの作成（既存ユーザーはスキップ）
npm run init-users

# 基本ユーザーデータの強制リセット・再作成
npm run init-users-force

# スタンドアロンLDAPサーバーの起動
npm run ldap-server

# コマンドライン認証テスト
npm run test-auth

# ユーザー検索テスト
npm run test-auth search
```

## 🌐 WebUI機能詳細

### タブ構成

SimpleLDAPは3つの主要なタブで構成され、各機能が整理されています：

#### 1. 🧪 Authentication Test
- **認証テスト機能**: メールアドレスとパスワードでのリアルタイム認証検証
- **サンプルアカウント表示**: クリックで自動入力可能な4つのテストアカウント
- **認証結果表示**: 成功/失敗の詳細情報と社員情報の表示

#### 2. 👥 Employee Management
- **社員追加フォーム**: 
  - 基本情報（メール、パスワード、氏名）
  - 社員情報（社員番号、部署、役職、雇用形態）
  - 連絡先（内線、携帯、勤務地）
  - システム権限（管理者レベル設定）
- **社員一覧テーブル**: 
  - 全社員の詳細情報を表形式で表示
  - 役職、雇用形態による色分け表示
  - 削除機能付き

#### 3. 🏢 Organization
- **組織統計ダッシュボード**: 全社員数、部門数、部署数、管理者数
- **組織構造ビュー**: 部門・部署別の階層表示と人数統計
- **管理階層ツリー**: 上司・部下関係の視覚的な階層表示
- **部署別統計**: 各部署の詳細統計（総員数、管理者数、平均勤続年数）

### API エンドポイント

#### 社員管理
- `GET /api/ldap/users` - 全社員取得
- `POST /api/ldap/users` - 社員作成
- `GET /api/ldap/users/[email]` - 特定社員取得
- `PUT /api/ldap/users/[email]` - 社員更新
- `DELETE /api/ldap/users/[email]` - 社員削除

#### 認証
- `POST /api/ldap/auth` - 認証テスト

#### 組織管理
- `GET /api/ldap/departments` - 部署・部門統計取得
- `GET /api/ldap/organization` - 組織図データ取得

#### サーバー管理
- `GET /api/ldap/server` - サーバー状態取得
- `POST /api/ldap/server` - サーバー制御

## 🔧 技術スタック

### フロントエンド
- **Next.js 15.3.4** - React フレームワーク (App Router)
- **React 19.0.0** - UIライブラリ
- **Tailwind CSS v4** - ユーティリティファーストCSSフレームワーク
- **TypeScript 5.x** - 型安全性とDX向上

### バックエンド
- **Node.js** - サーバーサイドランタイム
- **ldapjs 3.0.7** - LDAP プロトコル実装
- **bcrypt 6.0.0** - セキュアなパスワードハッシュ化
- **Next.js API Routes** - モダンなRESTful API実装

### アーキテクチャパターン
- **コンポーネント駆動開発**: 再利用可能なReactコンポーネント
- **カスタムフック**: ビジネスロジックの分離と再利用
- **型安全性**: 完全なTypeScript型定義
- **エラーハンドリング**: 統一されたAPIレスポンス形式

### データストレージ
- **JSON ファイル** - 軽量データ永続化
- **インメモリキャッシュ** - 高速なデータアクセス

## 📚 LDAP実装詳細

### 認証フロー

1. **WebUI認証**: ブラウザ → API Routes → UserManager
2. **LDAP認証**: LDAPクライアント → LDAPサーバー → UserManager
3. **DN形式**: `mail={email},ou=users,dc=example,dc=com`

### データ形式

```json
{
  "users": {
    "tanaka.sales@company.com": {
      "dn": "mail=tanaka.sales@company.com,ou=users,dc=example,dc=com",
      "password": "$2b$10$hashedpassword...",
      "attributes": {
        "mail": "tanaka.sales@company.com",
        "cn": "田中営業課長",
        "givenName": "三郎",
        "sn": "田中",
        "role": "employee",
        // 社員情報
        "employeeNumber": "EMP001",
        "department": "営業部",
        "division": "営業本部",
        "title": "営業課長",
        "manager": "cn=佐藤営業部長,ou=users,dc=company,dc=com",
        "employeeType": "正社員",
        "mobile": "080-0101-0101",
        "physicalDeliveryOfficeName": "東京本社",
        "costCenter": "CC-SALES-001",
        "hireDate": "2018-07-15",
        "jobCode": "SALES-MGR",
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

## 🚀 今後の拡張予定

### Phase 1: 外部API対応
- **RESTful API**: 外部システム向けの認証・社員情報API
- **API認証**: API Key/JWT による認証機能
- **OpenAPI仕様**: Swagger/OpenAPI ドキュメント生成
- **レート制限**: API利用制限とセキュリティ強化

### Phase 2: MCP (Model Context Protocol) 対応
- **AIエージェント連携**: ChatGPT/Claude等からの社員情報アクセス
- **MCPツール実装**: 社員検索、組織構造取得、権限管理
- **セキュアな統合**: MCPプロトコルでの安全なデータアクセス

### Phase 3: エンタープライズ機能
- **PostgreSQL対応**: スケーラブルなデータベース統合
- **LDAPS (LDAP over SSL)**: セキュアな通信
- **Active Directory連携**: 既存AD環境との統合
- **監査ログ**: 全操作の詳細ログ記録

## 🤝 貢献

このプロジェクトは学習・検証目的で作成されました。改善提案やバグ報告は歓迎します。

### 貢献方法
1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🔗 関連リンク

### プロジェクトドキュメント
- [LDAP調査レポート](./output/LDAP調査レポート.md)
- [LDAP認証テスト環境の実現可能性](./output/LDAP認証テスト環境の実現可能性.md)
- [LDAPユーザー情報の保存方法](./output/LDAPユーザー情報の保存方法.md)
- [社員情報属性の追加方法](./output/社員情報属性の追加方法.md)

### 外部リソース
- [Next.js Documentation](https://nextjs.org/docs)
- [ldapjs Documentation](https://ldapjs.org/)
- [LDAP Wikipedia](https://ja.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol)

---

**SimpleLDAP** - Modern Employee Management System with LDAP Authentication

*From a simple LDAP test environment to a comprehensive employee management solution*