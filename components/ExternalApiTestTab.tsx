'use client';

import { useState } from 'react';

interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

interface ApiTestResult {
  endpoint: string;
  method: string;
  status: number;
  response: ApiResponse;
  responseTime: number;
  error?: string;
}

const API_ENDPOINTS = [
  {
    name: '認証API',
    endpoint: '/api/v1/external/auth/verify',
    method: 'POST',
    description: 'メールアドレスとパスワードによる認証',
    sampleBody: {
      email: 'tanaka.sales@company.com',
      password: 'tanaka123'
    }
  },
  {
    name: '社員一覧API',
    endpoint: '/api/v1/external/employees',
    method: 'GET',
    description: '全社員の一覧取得',
    queryParams: '?limit=5'
  },
  {
    name: '社員検索API',
    endpoint: '/api/v1/external/employees',
    method: 'GET',
    description: '部署での社員検索',
    queryParams: '?department=営業部&limit=3'
  },
  {
    name: '社員詳細API',
    endpoint: '/api/v1/external/employees/EMP001',
    method: 'GET',
    description: '特定社員の詳細情報'
  },
  {
    name: '組織構造API',
    endpoint: '/api/v1/external/organization',
    method: 'GET',
    description: '会社の組織構造と統計'
  },
  {
    name: '部署一覧API',
    endpoint: '/api/v1/external/departments',
    method: 'GET',
    description: '部署一覧と統計情報'
  },
  {
    name: '部署詳細API',
    endpoint: '/api/v1/external/departments/営業部',
    method: 'GET',
    description: '特定部署の詳細情報'
  }
];

export function ExternalApiTestTab() {
  const [apiKey, setApiKey] = useState('test-api-key-1');
  // 現在のブラウザのホストとポートを自動検出
  const [baseUrl, setBaseUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.host}`;
    }
    return 'http://localhost:3001';
  });
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [runningTest, setRunningTest] = useState<string | null>(null);

  const executeApiCall = async (endpoint: typeof API_ENDPOINTS[0]) => {
    setRunningTest(endpoint.name);
    const startTime = Date.now();
    
    try {
      const url = `${baseUrl}${endpoint.endpoint}${endpoint.queryParams || ''}`;
      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      };

      if (endpoint.method === 'POST' && endpoint.sampleBody) {
        options.body = JSON.stringify(endpoint.sampleBody);
      }

      const response = await fetch(url, options);
      const responseData = await response.json();
      const responseTime = Date.now() - startTime;

      const result: ApiTestResult = {
        endpoint: endpoint.endpoint + (endpoint.queryParams || ''),
        method: endpoint.method,
        status: response.status,
        response: responseData,
        responseTime
      };

      setTestResults(prev => [result, ...prev]);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: ApiTestResult = {
        endpoint: endpoint.endpoint + (endpoint.queryParams || ''),
        method: endpoint.method,
        status: 0,
        response: {
          success: false,
          meta: { timestamp: new Date().toISOString(), version: '1.0' }
        },
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      setTestResults(prev => [result, ...prev]);
    } finally {
      setRunningTest(null);
    }
  };

  const executeAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    for (const endpoint of API_ENDPOINTS) {
      await executeApiCall(endpoint);
      // 少し待機してレート制限を回避
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testConnection = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/external/employees?limit=1`, {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert('✅ 接続成功！APIサーバーが正常に動作しています。');
      } else {
        alert(`❌ 接続失敗：HTTP ${response.status}`);
      }
    } catch (error) {
      alert(`❌ 接続エラー：${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  const formatJson = (obj: unknown) => {
    return JSON.stringify(obj, null, 2);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600 bg-green-50';
    if (status >= 400 && status < 500) return 'text-orange-600 bg-orange-50';
    if (status >= 500) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const analyzeDataStructure = (data: unknown): string => {
    if (typeof data !== 'object' || data === null) {
      return typeof data;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) return 'Array (empty)';
      return `Array[${data.length}] of ${analyzeDataStructure(data[0])}`;
    }

    const keys = Object.keys(data as Record<string, unknown>);
    if (keys.length === 0) return 'Object (empty)';
    
    return `Object {${keys.join(', ')}}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🔌 外部API テスト</h2>
        <p className="text-gray-600 mb-6">
          SimpleLDAPの外部APIエンドポイントをテストし、レスポンスデータの構造を確認できます。
        </p>

        {/* 設定セクション */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ベースURL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="http://localhost:3000"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setBaseUrl('http://localhost:3000')}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              >
                :3000
              </button>
              <button
                onClick={() => setBaseUrl('http://localhost:3001')}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              >
                :3001
              </button>
              <button
                onClick={() => setBaseUrl('http://localhost:3002')}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              >
                :3002
              </button>
              <button
                onClick={() => setBaseUrl('http://localhost:3003')}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              >
                :3003
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              APIキー
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="test-api-key-1"
            />
          </div>
        </div>

        {/* コントロールボタン */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={testConnection}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            🔗 接続テスト
          </button>
          <button
            onClick={executeAllTests}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                全APIテスト実行中...
              </>
            ) : (
              <>
                🚀 全APIテスト実行
              </>
            )}
          </button>
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            🗑️ 結果クリア
          </button>
        </div>

        {/* 個別APIテストボタン */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {API_ENDPOINTS.map((endpoint, index) => (
            <button
              key={index}
              onClick={() => executeApiCall(endpoint)}
              disabled={runningTest === endpoint.name}
              className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-medium text-sm">{endpoint.name}</div>
              <div className="text-xs text-gray-600 mt-1">
                {endpoint.method} {endpoint.endpoint}
              </div>
              <div className="text-xs text-gray-500 mt-1">{endpoint.description}</div>
              {runningTest === endpoint.name && (
                <div className="mt-2 flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  実行中...
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* テスト結果 */}
      {testResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 テスト結果</h3>
          
          {/* 統計サマリー */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{testResults.length}</div>
              <div className="text-sm text-gray-600">実行済みテスト</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {testResults.filter(r => r.status >= 200 && r.status < 300).length}
              </div>
              <div className="text-sm text-gray-600">成功</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {testResults.filter(r => r.status >= 400).length}
              </div>
              <div className="text-sm text-gray-600">エラー</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {Math.round(testResults.reduce((acc, r) => acc + r.responseTime, 0) / testResults.length)}ms
              </div>
              <div className="text-sm text-gray-600">平均応答時間</div>
            </div>
          </div>

          {/* 個別結果 */}
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(result.status)}`}>
                      {result.status || 'ERROR'}
                    </span>
                    <span className="font-medium text-gray-900">
                      {result.method} {result.endpoint}
                    </span>
                    <span className="text-sm text-gray-500">
                      {result.responseTime}ms
                    </span>
                  </div>
                </div>

                {result.error && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="text-red-800 font-medium">エラー:</div>
                    <div className="text-red-700 text-sm mt-1">{result.error}</div>
                  </div>
                )}

                {/* データ構造分析 */}
                {result.response.data !== undefined && result.response.data !== null && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-blue-800 font-medium mb-2">📋 データ構造分析:</div>
                    <div className="text-blue-700 text-sm">
                      <strong>タイプ:</strong> {analyzeDataStructure(result.response.data)}
                    </div>
                    {typeof result.response.data === 'object' && result.response.data !== null && (
                      <div className="mt-2">
                        <div className="text-blue-700 text-sm">
                          <strong>主要キー:</strong> {Object.keys(result.response.data as Record<string, unknown>).join(', ')}
                        </div>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {Array.isArray((result.response.data as any)?.employees) && (
                          <div className="text-blue-700 text-sm">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <strong>社員データ数:</strong> {(result.response.data as any).employees.length}件
                          </div>
                        )}
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(result.response.data as any)?.pagination && (
                          <div className="text-blue-700 text-sm">
                            <strong>ページネーション:</strong> 
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(result.response.data as any).pagination.page}/{(result.response.data as any).pagination.totalPages}ページ
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            （全{(result.response.data as any).pagination.total}件）
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* JSONレスポンス */}
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    📄 フルレスポンス表示
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                    {formatJson(result.response)}
                  </pre>
                </details>

                {/* パーサー例 */}
                {result.response.success && result.response.data !== undefined && result.response.data !== null && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      🔧 JavaScriptパーサー例
                    </summary>
                    <div className="mt-2 p-3 bg-gray-900 text-green-400 rounded text-xs overflow-auto">
                      <pre>{generateParserCode(result.response.data, result.endpoint)}</pre>
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function generateParserCode(data: unknown, endpoint: string): string {
  if (endpoint.includes('/employees') && !endpoint.includes('/employees/')) {
    return `// 社員一覧APIのパーサー例
const response = await fetch('/api/v1/external/employees', {
  headers: { 'X-API-Key': 'your-api-key' }
});
const result = await response.json();

if (result.success) {
  const employees = result.data.employees;
  const pagination = result.data.pagination;
  
  // 社員データの処理
  employees.forEach(employee => {
    console.log(\`\${employee.cn} (\${employee.email})\`);
    console.log(\`部署: \${employee.department}\`);
    console.log(\`役職: \${employee.title}\`);
  });
  
  // ページネーション情報
  console.log(\`ページ: \${pagination.page}/\${pagination.totalPages}\`);
  console.log(\`総件数: \${pagination.total}\`);
}`;
  }
  
  if (endpoint.includes('/employees/')) {
    return `// 社員詳細APIのパーサー例
const response = await fetch('/api/v1/external/employees/EMP001', {
  headers: { 'X-API-Key': 'your-api-key' }
});
const result = await response.json();

if (result.success) {
  const employee = result.data.employee;
  
  console.log(\`名前: \${employee.cn}\`);
  console.log(\`部署: \${employee.department}\`);
  console.log(\`管理者: \${employee.manager || 'なし'}\`);
  console.log(\`部下数: \${employee.subordinatesCount}人\`);
}`;
  }
  
  if (endpoint.includes('/organization')) {
    return `// 組織構造APIのパーサー例
const response = await fetch('/api/v1/external/organization', {
  headers: { 'X-API-Key': 'your-api-key' }
});
const result = await response.json();

if (result.success) {
  const { divisions, totalEmployees, managementHierarchy } = result.data;
  
  console.log(\`総従業員数: \${totalEmployees}人\`);
  
  // 部門別の情報
  divisions.forEach(division => {
    console.log(\`\${division.name}: \${division.employeeCount}人\`);
    division.departments.forEach(dept => {
      console.log(\`  - \${dept.name}: \${dept.employeeCount}人\`);
    });
  });
}`;
  }
  
  if (endpoint.includes('/auth/verify')) {
    return `// 認証APIのパーサー例
const response = await fetch('/api/v1/external/auth/verify', {
  method: 'POST',
  headers: { 
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});
const result = await response.json();

if (result.success && result.data.authenticated) {
  const employee = result.data.employee;
  console.log(\`認証成功: \${employee.name}\`);
  console.log(\`権限: \${employee.role}\`);
} else {
  console.log('認証失敗');
}`;
  }
  
  return `// 汎用パーサー例
const response = await fetch('${endpoint}', {
  headers: { 'X-API-Key': 'your-api-key' }
});
const result = await response.json();

if (result.success) {
  console.log('データ:', result.data);
} else {
  console.error('エラー:', result.error);
}`;
}