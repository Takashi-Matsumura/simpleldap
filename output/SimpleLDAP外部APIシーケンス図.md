# SimpleLDAP 外部API シーケンス図

## 概要
SimpleLDAPの外部APIシステムにおける各種やりとりをシーケンス図で表現します。

---

## 1. 認証API（POST）のシーケンス

```mermaid
sequenceDiagram
    participant Client as 外部システム/ブラウザ
    participant MW as middleware.ts
    participant Auth as api-auth.ts
    participant Route as auth/verify/route.ts
    participant UM as UserManager
    participant Data as users.json

    Client->>Route: POST /api/v1/external/auth/verify
    Note over Client,Route: Headers: X-API-Key, Content-Type
    Note over Client,Route: Body: {email, password}

    Route->>Auth: authenticateRequest(request)
    Auth->>Auth: APIキーの検証
    Auth->>Auth: レート制限チェック
    
    alt APIキーが無効
        Auth-->>Route: {authenticated: false, error: "Invalid API key"}
        Route-->>Client: 401 Unauthorized
    else APIキーが有効
        Auth-->>Route: {authenticated: true, clientName: "Client"}
        
        Route->>Route: バリデーション（email, password必須）
        
        alt バリデーションエラー
            Route-->>Client: 400 Bad Request
            Note over Route,Client: {success: false, error: "VALIDATION_ERROR"}
        else バリデーションOK
            Route->>UM: authenticateUser(email, password)
            UM->>Data: ユーザー検索
            Data-->>UM: ユーザーデータ
            UM->>UM: パスワード検証（bcrypt）
            
            alt 認証失敗
                UM-->>Route: null
                Route-->>Client: 200 OK
                Note over Route,Client: {success: true, data: {authenticated: false}}
            else 認証成功
                UM-->>Route: ユーザーオブジェクト
                Route->>Route: filterSensitiveData(user)
                Route-->>Client: 200 OK
                Note over Route,Client: {success: true, data: {authenticated: true, employee: {...}}}
            end
        end
    end
```

---

## 2. 社員一覧API（GET）のシーケンス

```mermaid
sequenceDiagram
    participant Client as 外部システム/ブラウザ
    participant MW as middleware.ts
    participant Auth as api-auth.ts
    participant Route as employees/route.ts
    participant Utils as external-api-utils.ts
    participant UM as UserManager
    participant Data as users.json

    Client->>Route: GET /api/v1/external/employees?department=営業部&limit=5
    Note over Client,Route: Headers: X-API-Key

    Route->>Auth: authenticateRequest(request)
    Auth->>Auth: APIキー検証 + レート制限
    
    alt 認証失敗
        Auth-->>Route: {authenticated: false}
        Route-->>Client: 401 Unauthorized
    else 認証成功
        Auth-->>Route: {authenticated: true, rateLimitRemaining: 999}
        
        Route->>Utils: parseQueryParams(request.url)
        Utils-->>Route: {department: "営業部", limit: 5, page: 1, ...}
        
        Route->>UM: getAllUsers()
        UM->>Data: ファイル読み込み
        Data-->>UM: 全ユーザーデータ
        UM-->>Route: usersオブジェクト
        
        Route->>Route: フィルタリング処理
        Note over Route: 部署="営業部"でフィルタ
        
        Route->>Utils: calculatePagination(total, page, limit)
        Utils-->>Route: ページネーション情報
        
        Route->>Route: ページネーション適用
        Route->>Utils: filterSensitiveData(employees)
        Utils-->>Route: センシティブ情報除去済みデータ
        
        Route->>Utils: createApiSuccessResponse(data, authResult)
        Utils->>Utils: レスポンス構築 + レート制限ヘッダー設定
        Utils-->>Route: NextResponse
        
        Route-->>Client: 200 OK
        Note over Route,Client: {success: true, data: {employees: [...], pagination: {...}}}
    end
```

---

## 3. 社員詳細API（GET）のシーケンス

```mermaid
sequenceDiagram
    participant Client as 外部システム/ブラウザ
    participant Route as employees/[id]/route.ts
    participant Auth as api-auth.ts
    participant UM as UserManager
    participant Data as users.json

    Client->>Route: GET /api/v1/external/employees/EMP001
    Note over Client,Route: Headers: X-API-Key

    Route->>Auth: authenticateRequest(request)
    
    alt 認証失敗
        Auth-->>Route: {authenticated: false}
        Route-->>Client: 401 Unauthorized
    else 認証成功
        Auth-->>Route: {authenticated: true}
        
        Route->>Route: await params (Next.js 15対応)
        Route->>UM: getAllUsers()
        UM->>Data: ファイル読み込み
        Data-->>UM: 全ユーザーデータ
        UM-->>Route: usersオブジェクト
        
        Route->>Route: 社員検索ロジック
        Note over Route: IDまたはemailで検索
        
        alt 社員が見つからない
            Route-->>Client: 404 Not Found
            Note over Route,Client: {success: false, error: "NOT_FOUND"}
        else 社員が見つかった
            Route->>Route: 管理者・部下情報の構築
            Route->>Route: filterSensitiveData(employee)
            
            Route-->>Client: 200 OK
            Note over Route,Client: {success: true, data: {employee: {...}}}
        end
    end
```

---

## 4. 組織構造API（GET）のシーケンス

```mermaid
sequenceDiagram
    participant Client as 外部システム/ブラウザ
    participant Route as organization/route.ts
    participant Auth as api-auth.ts
    participant UM as UserManager
    participant Data as users.json

    Client->>Route: GET /api/v1/external/organization
    Note over Client,Route: Headers: X-API-Key

    Route->>Auth: authenticateRequest(request)
    
    alt 認証失敗
        Auth-->>Route: {authenticated: false}
        Route-->>Client: 401 Unauthorized
    else 認証成功
        Auth-->>Route: {authenticated: true}
        
        Route->>UM: getAllUsers()
        UM->>Data: ファイル読み込み
        Data-->>UM: 全ユーザーデータ
        UM-->>Route: usersオブジェクト
        
        Route->>Route: 社員マップ構築
        Note over Route: email -> employee情報のマッピング
        
        Route->>Route: 管理関係の構築
        Note over Route: DN解析によるmanager-subordinate関係
        
        Route->>Route: 部門・部署別グループ化
        Note over Route: division/department階層構造構築
        
        Route->>Route: トップレベルマネージャー特定
        Route->>Route: 管理階層ツリー構築（再帰処理）
        
        Route->>Route: レスポンスデータ構築
        Note over Route: divisions, totalEmployees, managementHierarchy
        
        Route-->>Client: 200 OK
        Note over Route,Client: {success: true, data: {divisions: [...], managementHierarchy: [...]}}
    end
```

---

## 5. 部署詳細API（GET）のシーケンス

```mermaid
sequenceDiagram
    participant Client as 外部システム/ブラウザ
    participant Route as departments/[name]/route.ts
    participant Auth as api-auth.ts
    participant UM as UserManager
    participant Data as users.json

    Client->>Route: GET /api/v1/external/departments/営業部
    Note over Client,Route: Headers: X-API-Key

    Route->>Auth: authenticateRequest(request)
    
    alt 認証失敗
        Auth-->>Route: {authenticated: false}
        Route-->>Client: 401 Unauthorized
    else 認証成功
        Auth-->>Route: {authenticated: true}
        
        Route->>Route: await params (部署名取得)
        Route->>Route: decodeURIComponent(部署名)
        
        Route->>UM: getAllUsers()
        UM->>Data: ファイル読み込み
        Data-->>UM: 全ユーザーデータ
        UM-->>Route: usersオブジェクト
        
        Route->>Route: 部署の社員フィルタリング
        Note over Route: department === 指定部署名
        
        alt 部署が見つからない/社員がいない
            Route-->>Client: 404 Not Found
            Note over Route,Client: {success: false, error: "NOT_FOUND"}
        else 部署が見つかった
            Route->>Route: 統計情報計算
            Note over Route: 総員数、管理者数、平均勤続年数
            
            Route->>Route: マネージャー特定
            Route->>Route: filterSensitiveData(employees)
            
            Route-->>Client: 200 OK
            Note over Route,Client: {success: true, data: {department: {...}, employees: [...]}}
        end
    end
```

---

## 6. エラーハンドリングのシーケンス

```mermaid
sequenceDiagram
    participant Client as 外部システム/ブラウザ
    participant Route as Any Route
    participant Auth as api-auth.ts
    participant Utils as external-api-utils.ts

    Client->>Route: API Request (任意のエンドポイント)

    Route->>Auth: authenticateRequest(request)
    
    alt APIキーなし
        Auth-->>Route: {authenticated: false, error: "Bearer token is required"}
        Route->>Utils: createApiErrorResponse("UNAUTHORIZED", error, 401)
        Utils-->>Client: 401 + エラーレスポンス
    
    else 無効なAPIキー  
        Auth-->>Route: {authenticated: false, error: "Invalid API key"}
        Route->>Utils: createApiErrorResponse("UNAUTHORIZED", error, 401)
        Utils-->>Client: 401 + エラーレスポンス
    
    else レート制限超過
        Auth-->>Route: {authenticated: false, error: "Rate limit exceeded", rateLimitRemaining: 0}
        Route->>Utils: createApiErrorResponse("UNAUTHORIZED", error, 401)
        Utils-->>Client: 401 + レート制限ヘッダー
        
    else 内部エラー
        Route->>Route: try-catch でエラーキャッチ
        Route->>Utils: createApiErrorResponse("INTERNAL_ERROR", "An error occurred", 500)
        Utils-->>Client: 500 + エラーレスポンス
    end
```

---

## 7. 外部APIテストタブからのシーケンス

```mermaid
sequenceDiagram
    participant Browser as ブラウザ(React)
    participant Tab as ExternalApiTestTab
    participant API as SimpleLDAP API

    Browser->>Tab: ユーザーが「🔗 接続テスト」クリック
    Tab->>API: GET /api/v1/external/employees?limit=1
    Note over Tab,API: Headers: X-API-Key, Content-Type
    
    alt 接続成功
        API-->>Tab: 200 OK + 社員データ
        Tab->>Browser: alert("✅ 接続成功！")
    else 接続失敗
        API-->>Tab: 401/500 エラー
        Tab->>Browser: alert("❌ 接続失敗：HTTP XXX")
    end

    Browser->>Tab: ユーザーが「🚀 全APIテスト実行」クリック
    Tab->>Tab: setIsLoading(true)
    
    loop 各APIエンドポイント
        Tab->>API: executeApiCall(endpoint)
        API-->>Tab: レスポンス + 実行時間測定
        Tab->>Tab: 結果をtestResultsに追加
        Tab->>Tab: 100ms待機（レート制限回避）
    end
    
    Tab->>Tab: setIsLoading(false)
    Tab->>Browser: 統計情報 + 詳細結果表示
    Note over Tab,Browser: 成功/失敗数、平均レスポンス時間
    Note over Tab,Browser: 各APIの詳細レスポンス + パーサー例
```

---

## 8. 認証・レート制限の詳細フロー

```mermaid
sequenceDiagram
    participant Client as 外部システム
    participant Auth as api-auth.ts
    participant Store as rateLimitStore (Memory)

    Client->>Auth: authenticateRequest(request)
    Auth->>Auth: APIキー取得 (X-API-Key header)
    
    alt APIキーなし
        Auth->>Auth: authenticateBearerToken(request)
        Note over Auth: Bearer Token認証にフォールバック
    end
    
    Auth->>Auth: VALID_API_KEYS.get(apiKey)
    
    alt APIキーが無効
        Auth-->>Client: {authenticated: false, error: "Invalid API key"}
    else APIキーが有効
        Auth->>Auth: 現在時刻取得 + レート制限キー生成
        Note over Auth: rateLimitKey = apiKey:時間(1時間単位)
        
        Auth->>Store: rateLimitStore.get(rateLimitKey)
        Store-->>Auth: {count: N, resetTime: timestamp} または undefined
        
        alt レート制限超過
            Auth-->>Client: {authenticated: false, error: "Rate limit exceeded", rateLimitRemaining: 0}
        else レート制限内
            Auth->>Auth: count++
            Auth->>Store: rateLimitStore.set(rateLimitKey, updatedData)
            Auth->>Auth: 古いエントリのクリーンアップ
            
            Auth-->>Client: {authenticated: true, clientName: "Client", rateLimitRemaining: remaining}
        end
    end
```

---

## 主な特徴

### 🔐 セキュリティレイヤー
- **APIキー認証**: 全エンドポイントで必須
- **レート制限**: 時間あたりのリクエスト数制御
- **データフィルタリング**: センシティブ情報の自動除去

### 📊 データ処理
- **統一レスポンス**: 全APIで共通のレスポンス形式
- **エラーハンドリング**: 詳細なエラー情報とHTTPステータス
- **パフォーマンス**: ページネーション、フィールド選択

### 🚀 拡張性
- **認証プロバイダー**: Bearer Token認証のサポート
- **メタデータ**: タイムスタンプ、バージョン情報
- **CORS対応**: ブラウザからの直接アクセス可能

このシーケンス図により、SimpleLDAP外部APIの全体的な動作フローとコンポーネント間の相互作用を理解できます。