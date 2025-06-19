# 🔐 SimpleLDAP External API Documentation

## 概要

SimpleLDAPの外部API（v1）は、外部システムから社員情報や組織構造にアクセスするためのRESTful APIです。すべてのエンドポイントは読み取り専用（GET）で、認証が必要です。

## 基本情報

- **ベースURL**: `http://localhost:3000/api/v1/external`
- **認証方式**: APIキー または Bearer Token
- **レスポンス形式**: JSON
- **文字エンコーディング**: UTF-8

## 認証

### APIキー認証

```http
X-API-Key: your-api-key-here
```

### Bearer Token認証

```http
Authorization: Bearer your-jwt-token-here
```

### テスト用認証情報

開発環境では以下のテスト用APIキーが利用可能です：

- `test-api-key-1` - レート制限: 1000リクエスト/時
- `test-api-key-2` - レート制限: 500リクエスト/時

## レート制限

- APIキーごとに1時間あたりのリクエスト数が制限されています
- レート制限情報はレスポンスヘッダーに含まれます：
  - `X-RateLimit-Remaining`: 残りリクエスト数
  - `X-RateLimit-Reset`: リセット時刻（ISO 8601形式）

## レスポンス形式

### 成功レスポンス

```json
{
  "success": true,
  "data": {
    // エンドポイント固有のデータ
  },
  "meta": {
    "timestamp": "2024-01-20T10:00:00.000Z",
    "version": "1.0"
  }
}
```

### エラーレスポンス

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーの詳細説明"
  },
  "meta": {
    "timestamp": "2024-01-20T10:00:00.000Z",
    "version": "1.0"
  }
}
```

### エラーコード一覧

| コード | 説明 | HTTPステータス |
|--------|------|----------------|
| `UNAUTHORIZED` | 認証エラー | 401 |
| `NOT_FOUND` | リソースが見つからない | 404 |
| `VALIDATION_ERROR` | 入力値検証エラー | 400 |
| `RATE_LIMIT_EXCEEDED` | レート制限超過 | 429 |
| `INTERNAL_ERROR` | サーバー内部エラー | 500 |

## エンドポイント

### 1. 認証確認

ユーザーの認証情報を確認し、基本的な社員情報を返します。

#### エンドポイント

```
POST /auth/verify
```

#### リクエストボディ

```json
{
  "email": "user@company.com",
  "password": "password123"
}
```

#### レスポンス

```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "employee": {
      "email": "user@company.com",
      "name": "田中太郎",
      "employeeNumber": "EMP001",
      "department": "営業部",
      "division": "営業本部",
      "title": "営業課長",
      "employeeType": "正社員",
      "role": "employee"
    }
  },
  "meta": {
    "timestamp": "2024-01-20T10:00:00.000Z",
    "version": "1.0"
  }
}
```

### 2. 社員一覧・検索

社員の一覧取得と検索が可能です。

#### エンドポイント

```
GET /employees
```

#### クエリパラメータ

| パラメータ | 型 | 説明 | デフォルト |
|------------|-----|------|------------|
| `page` | integer | ページ番号 | 1 |
| `limit` | integer | 1ページあたりの件数（最大100） | 10 |
| `department` | string | 部署でフィルタ | - |
| `division` | string | 部門でフィルタ | - |
| `title` | string | 役職でフィルタ | - |
| `employeeType` | string | 雇用形態でフィルタ | - |
| `role` | string | システム権限でフィルタ（admin/manager/employee） | - |
| `search` | string | 名前、メール、社員番号で検索 | - |
| `sortBy` | string | ソート項目 | name |
| `sortOrder` | string | ソート順（asc/desc） | asc |
| `fields` | string | 取得フィールド（カンマ区切り） | 全フィールド |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "employeeNumber": "EMP001",
        "employeeId": "EMP001",
        "email": "tanaka@company.com",
        "cn": "田中太郎",
        "department": "営業部",
        "division": "営業本部",
        "title": "営業課長",
        "employeeType": "正社員",
        "role": "employee"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "department": "営業部",
      "search": null
    }
  },
  "meta": {
    "timestamp": "2024-01-20T10:00:00.000Z",
    "version": "1.0"
  }
}
```

### 3. 社員詳細

特定の社員の詳細情報を取得します。

#### エンドポイント

```
GET /employees/{id}
```

#### パラメータ

- `id`: 社員番号またはメールアドレス

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "employee": {
      "employeeNumber": "EMP001",
      "email": "tanaka@company.com",
      "name": "田中太郎",
      "givenName": "太郎",
      "surname": "田中",
      "department": "営業部",
      "division": "営業本部",
      "title": "営業課長",
      "role": "employee",
      "employeeType": "正社員",
      "telephoneNumber": "03-1234-0101",
      "mobile": "080-0101-0101",
      "physicalDeliveryOfficeName": "東京本社",
      "hireDate": "2018-07-15",
      "jobCode": "SALES-MGR",
      "manager": {
        "email": "sato@company.com",
        "name": "佐藤営業部長",
        "employeeNumber": "MGR001",
        "title": "営業部長"
      },
      "subordinates": [
        {
          "email": "yamada@company.com",
          "name": "山田花子",
          "employeeNumber": "EMP002",
          "title": "営業担当",
          "department": "営業部"
        }
      ],
      "subordinatesCount": 1
    }
  },
  "meta": {
    "timestamp": "2024-01-20T10:00:00.000Z",
    "version": "1.0"
  }
}
```

### 4. 組織構造

会社の組織構造と管理階層を取得します。

#### エンドポイント

```
GET /organization
```

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "divisions": [
      {
        "name": "営業本部",
        "employeeCount": 15,
        "departments": [
          {
            "name": "営業部",
            "employeeCount": 10,
            "manager": {
              "name": "佐藤営業部長",
              "email": "sato@company.com",
              "employeeNumber": "MGR001"
            }
          }
        ]
      }
    ],
    "totalEmployees": 100,
    "totalDivisions": 4,
    "totalDepartments": 10,
    "managementHierarchy": [
      {
        "name": "田中社長",
        "title": "代表取締役社長",
        "department": "経営陣",
        "employeeNumber": "CEO001",
        "subordinatesCount": 3,
        "subordinates": [
          {
            "name": "佐藤営業部長",
            "title": "営業部長",
            "department": "営業部",
            "employeeNumber": "MGR001",
            "subordinatesCount": 2,
            "subordinates": []
          }
        ]
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-20T10:00:00.000Z",
    "version": "1.0"
  }
}
```

### 5. 部署一覧・統計

全部署の一覧と統計情報を取得します。

#### エンドポイント

```
GET /departments
```

#### クエリパラメータ

| パラメータ | 型 | 説明 |
|------------|-----|------|
| `division` | string | 部門でフィルタ |

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "departments": [
      {
        "name": "営業部",
        "division": "営業本部",
        "statistics": {
          "totalEmployees": 10,
          "managers": 1,
          "employees": 8,
          "admins": 1,
          "averageYearsOfService": 3.5,
          "employeeTypes": {
            "正社員": 9,
            "契約社員": 1
          }
        }
      }
    ],
    "divisions": [
      {
        "name": "営業本部",
        "departmentCount": 2,
        "departments": ["営業部", "マーケティング部"],
        "totalEmployees": 15
      }
    ],
    "summary": {
      "totalDepartments": 10,
      "totalDivisions": 4,
      "totalEmployees": 100
    }
  },
  "meta": {
    "timestamp": "2024-01-20T10:00:00.000Z",
    "version": "1.0"
  }
}
```

### 6. 部署詳細

特定部署の詳細情報と所属社員一覧を取得します。

#### エンドポイント

```
GET /departments/{name}
```

#### パラメータ

- `name`: 部署名（URLエンコード必須）

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "department": {
      "name": "営業部",
      "division": "営業本部",
      "manager": {
        "name": "佐藤営業部長",
        "email": "sato@company.com",
        "employeeNumber": "MGR001"
      },
      "statistics": {
        "totalEmployees": 10,
        "managers": 1,
        "employees": 8,
        "admins": 1,
        "employeeTypes": {
          "正社員": 9,
          "契約社員": 1
        },
        "titles": {
          "営業部長": 1,
          "営業課長": 2,
          "営業担当": 7
        },
        "averageYearsOfService": 3.5
      },
      "employees": [
        {
          "employeeNumber": "MGR001",
          "email": "sato@company.com",
          "name": "佐藤営業部長",
          "title": "営業部長",
          "role": "manager",
          "employeeType": "正社員",
          "hireDate": "2016-04-01"
        }
      ]
    }
  },
  "meta": {
    "timestamp": "2024-01-20T10:00:00.000Z",
    "version": "1.0"
  }
}
```

## 使用例

### cURL

```bash
# 認証確認
curl -X POST http://localhost:3000/api/v1/external/auth/verify \
  -H "X-API-Key: test-api-key-1" \
  -H "Content-Type: application/json" \
  -d '{"email":"tanaka@company.com","password":"tanaka123"}'

# 社員一覧（営業部でフィルタ）
curl -X GET "http://localhost:3000/api/v1/external/employees?department=営業部&limit=20" \
  -H "X-API-Key: test-api-key-1"

# 社員詳細
curl -X GET http://localhost:3000/api/v1/external/employees/EMP001 \
  -H "X-API-Key: test-api-key-1"

# 組織構造
curl -X GET http://localhost:3000/api/v1/external/organization \
  -H "X-API-Key: test-api-key-1"
```

### JavaScript (Fetch API)

```javascript
// APIクライアントの例
class SimpleLDAPClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'http://localhost:3000/api/v1/external';
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error.message);
    }
    
    return data.data;
  }

  // 認証確認
  async verifyAuth(email, password) {
    return this.request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  // 社員検索
  async searchEmployees(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/employees?${query}`);
  }

  // 社員詳細
  async getEmployee(id) {
    return this.request(`/employees/${id}`);
  }

  // 組織構造
  async getOrganization() {
    return this.request('/organization');
  }
}

// 使用例
const client = new SimpleLDAPClient('test-api-key-1');

// 社員検索
const result = await client.searchEmployees({
  department: '営業部',
  limit: 20
});
console.log(result.employees);
```

## セキュリティ考慮事項

1. **HTTPS使用推奨**: 本番環境では必ずHTTPSを使用してください
2. **APIキー管理**: APIキーは環境変数で管理し、コードに直接記述しないでください
3. **CORS設定**: 必要に応じてCORSの許可オリジンを制限してください
4. **レート制限**: APIの過度な使用を防ぐため、レート制限を遵守してください

## 変更履歴

- **v1.0** (2024-01-20): 初回リリース
  - 認証確認、社員管理、組織構造、部署管理の各APIを実装