# SimpleLDAP MCP Server 実装ログ

## 概要
このドキュメントは、SimpleLDAP社員管理システムにMCP（Model Context Protocol）サーバーを実装したフェーズの開発ログです。

**実装期間**: 2025-06-19  
**開発者**: Claude Code Assistant  
**目的**: Claude DesktopからSimpleLDAPの社員データにアクセスできるMCPサーバーの構築

## 1. 設計フェーズ

### 1.1 要件確認
ユーザーからの要件：
- SimpleLDAPサーバーとは別にMCPサーバーを構築
- MCPサーバーを介してLDAPサーバーの社員情報を操作
- Claude DesktopをMCPクライアントとして使用

### 1.2 設計方針
採用した設計：
```
Claude Desktop <--(MCP Protocol)--> MCP Server <--(REST API)--> SimpleLDAP Server
```

**技術スタック**:
- TypeScript
- @modelcontextprotocol/sdk
- node-fetch（API通信用）
- Zod（スキーマ検証）

## 2. 実装フェーズ

### 2.1 プロジェクト構造
```
mcp-server/
├── src/
│   ├── index.ts              # メインサーバー
│   ├── api-client.ts         # SimpleLDAP APIクライアント
│   ├── types.ts              # 型定義
│   ├── config/               # 設定管理
│   ├── constants.ts          # 定数定義
│   ├── utils/                # ユーティリティ
│   │   ├── error-handler.ts  # エラーハンドリング
│   │   └── formatters.ts     # 出力フォーマッター
│   └── tools/                # MCPツール実装
│       ├── registry.ts       # ツールレジストリ
│       ├── employee-search.ts
│       ├── employee-details.ts
│       ├── organization.ts
│       ├── department.ts
│       ├── auth-verify.ts
│       └── statistics.ts
├── dist/                     # ビルド成果物
├── package.json
├── tsconfig.json
├── README.md
└── claude_desktop_config.json
```

### 2.2 実装したMCPツール

#### 1. `search_employees` - 社員検索
- 名前、部署、部門、役職でのフィルタリング
- ページネーション対応（最大100件）
- 日本語での結果表示

#### 2. `get_employee_details` - 社員詳細情報
- 社員IDまたはメールアドレスで検索
- 上司・部下の関係情報を含む
- 関連操作の提案付き

#### 3. `get_organization_structure` - 組織構造
- 部門・部署の階層構造
- 管理階層ツリーの表示
- 組織全体の統計情報

#### 4. `get_department_info` - 部署情報
- 特定部署の詳細と所属社員
- 部署統計（平均勤続年数など）
- 役職別グルーピング

#### 5. `verify_employee_auth` - 認証確認
- メール/パスワードでの認証テスト
- セキュリティ警告付き
- 認証失敗時のトラブルシューティング

#### 6. `get_company_statistics` - 会社統計
- 全社統計情報
- 部門別・部署別の詳細統計
- 管理階層の分析

### 2.3 主な技術的実装

#### APIクライアント
```typescript
export class SimpleLDAPClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  // 統一的なリクエストメソッド
  private async makeRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>>
  
  // タイムアウト対応のfetch実装
  private async fetchWithTimeout(url: string, options: any): Promise<NodeFetchResponse>
}
```

#### エラーハンドリング
- 集約化されたエラー処理
- コンテキストに応じたエラーメッセージ
- ユーザーフレンドリーな日本語エラー

#### 型安全性
- Zodスキーマによる入力検証
- TypeScriptの厳密な型定義
- JSON Schema形式でのツール定義

## 3. リファクタリングフェーズ

### 3.1 実施した改善

#### コード品質の向上
1. **エラーハンドリングの集約化**
   - `utils/error-handler.ts`で統一管理
   - エラータイプ別の適切なメッセージ

2. **型安全性の強化**
   - `any`型の排除
   - 専用の型定義ファイル追加

3. **設定管理の改善**
   - `config/index.ts`で環境変数検証
   - Zodスキーマによる設定検証

4. **定数の抽出**
   - マジックナンバーの排除
   - ハードコード文字列の定数化

5. **フォーマッターユーティリティ**
   - Markdown出力の統一
   - 再利用可能なフォーマット関数

6. **ツールレジストリパターン**
   - 動的なツール管理
   - 拡張性の向上

### 3.2 ビルドエラーの解決

#### 主なエラーと解決策

1. **Zod to JSON Schema変換**
   - 問題: MCPツールはJSON Schema形式を要求
   - 解決: ツール定義を手動でJSON Schema形式に変換

2. **TypeScript非同期パラメータ**
   - 問題: Next.js 15の新しい非同期params形式
   - 解決: `await params`でパラメータを解決

3. **node-fetch型の非互換性**
   - 問題: node-fetchとネイティブfetchの型不一致
   - 解決: 明示的な型インポートと型変換

## 4. 設定と使用方法

### 4.1 Claude Desktop設定

**設定ファイルの場所**:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**設定例**:
```json
{
  "mcpServers": {
    "simpleldap": {
      "command": "node",
      "args": [
        "/path/to/simpleldap/mcp-server/dist/index.js"
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

### 4.2 起動手順

1. SimpleLDAPメインサーバーを起動
   ```bash
   cd /path/to/simpleldap
   npm run dev
   ```

2. MCPサーバーをビルド
   ```bash
   cd mcp-server
   npm install
   npm run build
   ```

3. Claude Desktopを再起動

### 4.3 使用例

Claude Desktopでの質問例：
- 「営業部の社員一覧を教えてください」
- 「田中さんという名前の社員を検索してください」
- 「会社の組織構造を教えてください」
- 「IT部にはどんな社員がいますか？」

## 5. トラブルシューティング

### 5.1 よくある問題

#### 接続エラー
- SimpleLDAPサーバーが起動していることを確認
- ポート番号が正しいか確認（デフォルト: 3000）
- APIキーが正しいか確認

#### MCPツールが表示されない
- Claude Desktop設定ファイルのパスが正しいか確認
- ビルドが正常に完了しているか確認
- Claude Desktopを完全に終了して再起動

### 5.2 デバッグ方法

1. MCPサーバーの手動実行
   ```bash
   SIMPLELDAP_API_URL=http://localhost:3000 node dist/index.js
   ```

2. API接続テスト
   ```bash
   curl -X GET "http://localhost:3000/api/v1/external/employees?limit=1" \
     -H "X-API-Key: test-api-key-1"
   ```

## 6. セキュリティ考慮事項

1. **APIキー管理**
   - 本番環境では強力なAPIキーを使用
   - 環境変数で管理

2. **認証情報**
   - パスワード確認機能は慎重に使用
   - ログに認証情報を出力しない

3. **アクセス制御**
   - 読み取り専用のAPIを使用
   - センシティブ情報はフィルタリング

## 7. 今後の改善案

1. **キャッシング機能**
   - 頻繁にアクセスされるデータのキャッシュ
   - レスポンス時間の改善

2. **バッチリクエスト**
   - 複数のAPI呼び出しの最適化
   - ネットワーク効率の向上

3. **テスト自動化**
   - ユニットテストの追加
   - 統合テストの実装

4. **監視とロギング**
   - 詳細なログ記録
   - エラー監視の実装

## 8. まとめ

SimpleLDAP MCPサーバーの実装により、Claude DesktopからSimpleLDAPの社員データに自然な日本語でアクセスできるようになりました。リファクタリングにより、コードの保守性と拡張性が大幅に向上し、将来的な機能追加も容易になっています。

**主な成果**:
- 6つの包括的なMCPツール
- 型安全で保守性の高いコードベース
- 日本語に完全対応したユーザー体験
- Claude Desktopとのシームレスな統合

このMCPサーバーは、AIアシスタントと企業システムを統合する実践的な例として、今後の開発の参考になることでしょう。