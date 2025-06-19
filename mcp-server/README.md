# SimpleLDAP MCP Server

Claude Desktop integration for SimpleLDAP Employee Management System via Model Context Protocol (MCP).

## 概要

このMCPサーバーは、Claude DesktopからSimpleLDAPの社員管理システムにアクセスするためのツールを提供します。社員検索、組織構造の確認、認証テストなどの機能をClaude会話内で自然に使用できます。

## 🚀 クイックスタート

### 1. 依存関係のインストール

```bash
cd mcp-server
npm install
```

### 2. ビルド

```bash
npm run build
```

### 3. Claude Desktop設定

Claude Desktopの設定ファイル (`claude_desktop_config.json`) を編集します：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "simpleldap": {
      "command": "node",
      "args": [
        "/path/to/your/simpleldap/mcp-server/dist/index.js"
      ],
      "env": {
        "SIMPLELDAP_API_URL": "http://localhost:3000",
        "SIMPLELDAP_API_KEY": "test-api-key-1",
        "SIMPLELDAP_TIMEOUT": "10000"
      }
    }
  }
}
```

### 4. SimpleLDAPサーバーの起動

```bash
# メインのSimpleLDAPプロジェクトディレクトリで
npm run dev
```

### 5. Claude Desktopの再起動

設定を反映するためにClaude Desktopを再起動してください。

## 🛠️ 利用可能なツール

### 1. `search_employees` - 社員検索
社員を名前、部署、部門、役職で検索します。

**パラメータ:**
- `query` (optional): 検索キーワード
- `department` (optional): 部署フィルタ
- `division` (optional): 部門フィルタ
- `role` (optional): 権限フィルタ (admin/manager/employee)
- `limit` (optional): 結果件数 (1-100, デフォルト: 10)

### 2. `get_employee_details` - 社員詳細
特定社員の詳細情報を取得します。

**パラメータ:**
- `employee_id`: 社員IDまたはメールアドレス

### 3. `get_organization_structure` - 組織構造
会社の組織構造と管理階層を取得します。

**パラメータ:**
- `include_hierarchy` (optional): 管理階層を含めるか (デフォルト: true)

### 4. `get_department_info` - 部署情報
特定部署の詳細情報と所属社員を取得します。

**パラメータ:**
- `department_name`: 部署名

### 5. `verify_employee_auth` - 認証確認
社員の認証情報を確認します。

**パラメータ:**
- `email`: メールアドレス
- `password`: パスワード

### 6. `get_company_statistics` - 会社統計
会社全体の統計情報を取得します。

**パラメータ:**
- `include_departments` (optional): 部署別統計を含めるか (デフォルト: true)

## 💬 Claude Desktopでの使用例

```
User: "営業部の社員一覧を教えて"
Claude: search_employees ツールを使用して営業部の社員を検索します...

User: "田中営業課長の詳細情報を見せて"
Claude: get_employee_details ツールを使用して詳細情報を取得します...

User: "会社の組織図を表示して"
Claude: get_organization_structure ツールを使用して組織構造を取得します...
```

## ⚙️ 環境変数

| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| `SIMPLELDAP_API_URL` | `http://localhost:3000` | SimpleLDAP APIのベースURL |
| `SIMPLELDAP_API_KEY` | `test-api-key-1` | API認証キー |
| `SIMPLELDAP_TIMEOUT` | `10000` | APIリクエストタイムアウト (ms) |

## 🔧 開発

### ローカルテスト

```bash
# 開発モード（TypeScriptの変更を監視）
npm run watch

# 手動実行
npm run dev
```

### デバッグ

MCPサーバーはstderrにログを出力します：

```bash
node dist/index.js 2> debug.log
```

### APIテスト

SimpleLDAP外部APIが正常に動作していることを確認：

```bash
curl -X GET "http://localhost:3000/api/v1/external/employees?limit=1" \
  -H "X-API-Key: test-api-key-1"
```

## 🔒 セキュリティ

- APIキーは適切に管理してください
- 本番環境では強力なAPIキーを使用してください
- パスワード確認機能は慎重に使用してください

## 📝 トラブルシューティング

### よくある問題

#### 1. "SimpleLDAP API connection failed"
- SimpleLDAPサーバーが起動しているか確認
- APIキーが正しいか確認
- URLが正しいか確認

#### 2. Claude Desktopでツールが表示されない
- 設定ファイルのパスが正しいか確認
- Claude Desktopを再起動
- MCPサーバーのビルドが完了しているか確認

#### 3. "Unknown tool" エラー
- MCPサーバーが最新版にビルドされているか確認
- Claude Desktopの再起動

### ログの確認

```bash
# MCPサーバーのログを確認
tail -f ~/.config/Claude/logs/mcp-server.log
```

## 🤝 サポート

問題が発生した場合は、以下を確認してください：

1. SimpleLDAPメインサーバーが動作していること
2. 外部APIが正常に応答すること
3. MCPサーバーが正しくビルドされていること
4. Claude Desktop設定が正しいこと

詳細な情報は、メインのSimpleLDAPプロジェクトの[README.md](../README.md)を参照してください。