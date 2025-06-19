#!/usr/bin/env node

/**
 * SimpleLDAP External API Test Suite
 * 
 * 外部APIの包括的なテストプログラム
 * 使用方法: npm run test-external-api
 */

const https = require('https');
const http = require('http');

// テスト設定
const CONFIG = {
  baseUrl: 'http://localhost:3002/api/v1/external',
  apiKey: 'test-api-key-1',
  bearerToken: 'test-bearer-token',
  timeout: 10000
};

// テスト用アカウント
const TEST_ACCOUNTS = [
  { email: 'tanaka.sales@company.com', password: 'tanaka123', name: '田中営業課長' },
  { email: 'ceo@company.com', password: 'ceo123', name: '田中社長' },
  { email: 'invalid@company.com', password: 'wrong', name: '無効アカウント' }
];

// カラー出力用
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

// ログ関数
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  test: (msg) => console.log(`${colors.cyan}🧪${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.magenta}=== ${msg} ===${colors.reset}`)
};

// HTTPリクエスト関数
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(CONFIG.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// APIリクエスト関数
async function apiRequest(endpoint, options = {}) {
  const url = new URL(`${CONFIG.baseUrl}${endpoint}`);
  
  const requestOptions = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 3000),
    path: url.pathname + url.search,
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  // APIキーが明示的に設定されている場合のみ追加
  if (options.apiKey !== null && options.apiKey !== undefined) {
    requestOptions.headers['X-API-Key'] = options.apiKey;
  } else if (options.apiKey === undefined) {
    requestOptions.headers['X-API-Key'] = CONFIG.apiKey;
  }
  
  if (options.bearerToken) {
    requestOptions.headers['Authorization'] = `Bearer ${options.bearerToken}`;
    delete requestOptions.headers['X-API-Key'];
  }
  
  let postData = null;
  if (options.body) {
    postData = JSON.stringify(options.body);
    requestOptions.headers['Content-Length'] = Buffer.byteLength(postData);
  }
  
  return await makeRequest(requestOptions, postData);
}

// テスト結果の統計
let testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// アサート関数
function assert(condition, message, details = null) {
  testStats.total++;
  
  if (condition) {
    testStats.passed++;
    log.success(`${message}`);
    return true;
  } else {
    testStats.failed++;
    const errorMsg = `${message}${details ? ` - ${details}` : ''}`;
    testStats.errors.push(errorMsg);
    log.error(`${errorMsg}`);
    return false;
  }
}

// 1. 認証APIテスト
async function testAuthenticationAPI() {
  log.section('認証API テスト');
  
  // 有効な認証情報でのテスト
  log.test('有効な認証情報でのテスト');
  try {
    const response = await apiRequest('/auth/verify', {
      method: 'POST',
      body: {
        email: TEST_ACCOUNTS[0].email,
        password: TEST_ACCOUNTS[0].password
      }
    });
    
    assert(response.statusCode === 200, 'ステータスコードが200');
    assert(response.data.success === true, 'レスポンスのsuccessがtrue');
    assert(response.data.data.authenticated === true, '認証が成功');
    assert(response.data.data.employee.email === TEST_ACCOUNTS[0].email, 'メールアドレスが正しい');
    assert(response.data.data.employee.name !== undefined, '社員名が取得できている');
    
    // レート制限ヘッダーの確認
    assert(response.headers['x-ratelimit-remaining'] !== undefined, 'レート制限ヘッダーが存在');
    
  } catch (error) {
    log.error(`認証APIテストでエラー: ${error.message}`);
    testStats.failed++;
  }
  
  // 無効な認証情報でのテスト
  log.test('無効な認証情報でのテスト');
  try {
    const response = await apiRequest('/auth/verify', {
      method: 'POST',
      body: {
        email: TEST_ACCOUNTS[2].email,
        password: TEST_ACCOUNTS[2].password
      }
    });
    
    assert(response.statusCode === 200, 'ステータスコードが200（認証失敗でも200）');
    assert(response.data.data.authenticated === false, '認証が失敗');
    
  } catch (error) {
    log.error(`無効認証APIテストでエラー: ${error.message}`);
    testStats.failed++;
  }
  
  // 必須パラメータ不足のテスト
  log.test('必須パラメータ不足のテスト');
  try {
    const response = await apiRequest('/auth/verify', {
      method: 'POST',
      body: {
        email: TEST_ACCOUNTS[0].email
        // passwordを意図的に省略
      }
    });
    
    assert(response.statusCode === 400, 'バリデーションエラーで400');
    assert(response.data.success === false, 'レスポンスのsuccessがfalse');
    assert(response.data.error.code === 'VALIDATION_ERROR', 'エラーコードがVALIDATION_ERROR');
    
  } catch (error) {
    log.error(`バリデーションテストでエラー: ${error.message}`);
    testStats.failed++;
  }
}

// 2. 社員一覧APIテスト
async function testEmployeesAPI() {
  log.section('社員一覧API テスト');
  
  // 全社員取得
  log.test('全社員一覧の取得');
  try {
    const response = await apiRequest('/employees');
    
    assert(response.statusCode === 200, 'ステータスコードが200');
    assert(response.data.success === true, 'レスポンスのsuccessがtrue');
    assert(Array.isArray(response.data.data.employees), '社員データが配列');
    assert(response.data.data.employees.length > 0, '社員データが存在');
    assert(response.data.data.pagination !== undefined, 'ページネーション情報が存在');
    
    const firstEmployee = response.data.data.employees[0];
    assert(firstEmployee.email !== undefined, '社員にメールアドレスが存在');
    assert(firstEmployee.cn !== undefined, '社員に名前が存在');
    
  } catch (error) {
    log.error(`社員一覧テストでエラー: ${error.message}`);
    testStats.failed++;
  }
  
  // 部署フィルタリング
  log.test('部署フィルタリング');
  try {
    const response = await apiRequest('/employees?department=営業部&limit=20');
    
    assert(response.statusCode === 200, 'ステータスコードが200');
    assert(response.data.success === true, 'レスポンスのsuccessがtrue');
    
    const employees = response.data.data.employees;
    if (employees.length > 0) {
      const hasNonSalesDept = employees.some(emp => emp.department !== '営業部');
      assert(!hasNonSalesDept, '営業部以外の社員が含まれていない');
    }
    
    assert(response.data.data.filters.department === '営業部', 'フィルタ情報が正しい');
    
  } catch (error) {
    log.error(`部署フィルタテストでエラー: ${error.message}`);
    testStats.failed++;
  }
  
  // 検索機能
  log.test('社員検索');
  try {
    const response = await apiRequest('/employees?search=田中');
    
    assert(response.statusCode === 200, 'ステータスコードが200');
    assert(response.data.success === true, 'レスポンスのsuccessがtrue');
    
    const employees = response.data.data.employees;
    if (employees.length > 0) {
      const hasMatchingEmployee = employees.some(emp => 
        emp.cn?.includes('田中') || 
        emp.email?.includes('田中') || 
        emp.employeeNumber?.includes('田中')
      );
      assert(hasMatchingEmployee, '検索条件に一致する社員が含まれている');
    }
    
  } catch (error) {
    log.error(`社員検索テストでエラー: ${error.message}`);
    testStats.failed++;
  }
}

// 3. 社員詳細APIテスト
async function testEmployeeDetailAPI() {
  log.section('社員詳細API テスト');
  
  // 社員番号で検索
  log.test('社員番号での詳細取得');
  try {
    const response = await apiRequest('/employees/EMP001');
    
    assert(response.statusCode === 200, 'ステータスコードが200');
    assert(response.data.success === true, 'レスポンスのsuccessがtrue');
    assert(response.data.data.employee !== undefined, '社員データが存在');
    assert(response.data.data.employee.employeeNumber === 'EMP001', '社員番号が正しい');
    assert(response.data.data.employee.subordinatesCount !== undefined, '部下数が取得できている');
    
  } catch (error) {
    log.error(`社員詳細テストでエラー: ${error.message}`);
    testStats.failed++;
  }
  
  // メールアドレスで検索
  log.test('メールアドレスでの詳細取得');
  try {
    const response = await apiRequest(`/employees/${encodeURIComponent(TEST_ACCOUNTS[0].email)}`);
    
    assert(response.statusCode === 200, 'ステータスコードが200');
    assert(response.data.success === true, 'レスポンスのsuccessがtrue');
    assert(response.data.data.employee.email === TEST_ACCOUNTS[0].email, 'メールアドレスが正しい');
    
  } catch (error) {
    log.error(`メールアドレス検索テストでエラー: ${error.message}`);
    testStats.failed++;
  }
  
  // 存在しない社員
  log.test('存在しない社員の検索');
  try {
    const response = await apiRequest('/employees/NONEXISTENT');
    
    assert(response.statusCode === 404, 'ステータスコードが404');
    assert(response.data.success === false, 'レスポンスのsuccessがfalse');
    assert(response.data.error.code === 'NOT_FOUND', 'エラーコードがNOT_FOUND');
    
  } catch (error) {
    log.error(`存在しない社員テストでエラー: ${error.message}`);
    testStats.failed++;
  }
}

// 4. 組織構造APIテスト
async function testOrganizationAPI() {
  log.section('組織構造API テスト');
  
  log.test('組織構造の取得');
  try {
    const response = await apiRequest('/organization');
    
    assert(response.statusCode === 200, 'ステータスコードが200');
    assert(response.data.success === true, 'レスポンスのsuccessがtrue');
    assert(Array.isArray(response.data.data.divisions), '部門データが配列');
    assert(response.data.data.totalEmployees > 0, '総従業員数が0より大きい');
    assert(response.data.data.totalDivisions > 0, '総部門数が0より大きい');
    assert(Array.isArray(response.data.data.managementHierarchy), '管理階層が配列');
    
    // 部門構造の確認
    if (response.data.data.divisions.length > 0) {
      const firstDivision = response.data.data.divisions[0];
      assert(firstDivision.name !== undefined, '部門名が存在');
      assert(firstDivision.employeeCount !== undefined, '部門の従業員数が存在');
      assert(Array.isArray(firstDivision.departments), '部門の部署リストが配列');
    }
    
  } catch (error) {
    log.error(`組織構造テストでエラー: ${error.message}`);
    testStats.failed++;
  }
}

// 5. 部署APIテスト
async function testDepartmentsAPI() {
  log.section('部署API テスト');
  
  // 部署一覧取得
  log.test('部署一覧の取得');
  try {
    const response = await apiRequest('/departments');
    
    assert(response.statusCode === 200, 'ステータスコードが200');
    assert(response.data.success === true, 'レスポンスのsuccessがtrue');
    assert(Array.isArray(response.data.data.departments), '部署データが配列');
    assert(Array.isArray(response.data.data.divisions), '部門データが配列');
    assert(response.data.data.summary !== undefined, 'サマリー情報が存在');
    
    // 部署データの構造確認
    if (response.data.data.departments.length > 0) {
      const firstDept = response.data.data.departments[0];
      assert(firstDept.name !== undefined, '部署名が存在');
      assert(firstDept.statistics !== undefined, '統計情報が存在');
      assert(firstDept.statistics.totalEmployees !== undefined, '総従業員数が存在');
    }
    
  } catch (error) {
    log.error(`部署一覧テストでエラー: ${error.message}`);
    testStats.failed++;
  }
  
  // 特定部署の詳細取得
  log.test('特定部署の詳細取得');
  try {
    const response = await apiRequest(`/departments/${encodeURIComponent('営業部')}`);
    
    assert(response.statusCode === 200, 'ステータスコードが200');
    assert(response.data.success === true, 'レスポンスのsuccessがtrue');
    assert(response.data.data.department !== undefined, '部署データが存在');
    assert(response.data.data.department.name === '営業部', '部署名が正しい');
    assert(Array.isArray(response.data.data.department.employees), '社員リストが配列');
    
  } catch (error) {
    log.error(`部署詳細テストでエラー: ${error.message}`);
    testStats.failed++;
  }
  
  // 存在しない部署
  log.test('存在しない部署の検索');
  try {
    const response = await apiRequest(`/departments/${encodeURIComponent('存在しない部署')}`);
    
    assert(response.statusCode === 404, 'ステータスコードが404');
    assert(response.data.success === false, 'レスポンスのsuccessがfalse');
    
  } catch (error) {
    log.error(`存在しない部署テストでエラー: ${error.message}`);
    testStats.failed++;
  }
}

// 6. 認証エラーテスト
async function testAuthenticationErrors() {
  log.section('認証エラー テスト');
  
  // APIキーなし
  log.test('APIキーなしでのアクセス');
  try {
    const response = await apiRequest('/employees', { apiKey: null });
    
    assert(response.statusCode === 401, 'ステータスコードが401');
    assert(response.data.success === false, 'レスポンスのsuccessがfalse');
    assert(response.data.error.code === 'UNAUTHORIZED', 'エラーコードがUNAUTHORIZED');
    assert(response.data.error.message.includes('required'), 'エラーメッセージに認証要求が含まれている');
    
  } catch (error) {
    log.error(`APIキーなしテストでエラー: ${error.message}`);
    testStats.failed++;
  }
  
  // 無効なAPIキー
  log.test('無効なAPIキーでのアクセス');
  try {
    const response = await apiRequest('/employees', { apiKey: 'invalid-key' });
    
    assert(response.statusCode === 401, 'ステータスコードが401');
    assert(response.data.success === false, 'レスポンスのsuccessがfalse');
    
  } catch (error) {
    log.error(`無効APIキーテストでエラー: ${error.message}`);
    testStats.failed++;
  }
  
  // Bearer Token認証テスト
  log.test('Bearer Token認証');
  try {
    const response = await apiRequest('/employees', { 
      bearerToken: CONFIG.bearerToken,
      apiKey: null 
    });
    
    assert(response.statusCode === 200, 'Bearer Token認証が成功');
    assert(response.data.success === true, 'レスポンスのsuccessがtrue');
    
  } catch (error) {
    log.error(`Bearer Tokenテストでエラー: ${error.message}`);
    testStats.failed++;
  }
}

// 7. レート制限テスト
async function testRateLimit() {
  log.section('レート制限 テスト');
  
  log.test('レート制限ヘッダーの確認');
  try {
    const response = await apiRequest('/employees');
    
    assert(response.headers['x-ratelimit-remaining'] !== undefined, 'レート制限残数ヘッダーが存在');
    assert(response.headers['x-ratelimit-reset'] !== undefined, 'レート制限リセット時刻ヘッダーが存在');
    
    const remaining = parseInt(response.headers['x-ratelimit-remaining']);
    assert(remaining >= 0, 'レート制限残数が0以上');
    
    log.info(`現在のレート制限残数: ${remaining}`);
    
  } catch (error) {
    log.error(`レート制限テストでエラー: ${error.message}`);
    testStats.failed++;
  }
}

// 8. CORS対応テスト
async function testCORS() {
  log.section('CORS対応 テスト');
  
  log.test('OPTIONSリクエストのテスト');
  try {
    const response = await apiRequest('/employees', { method: 'OPTIONS' });
    
    assert(response.statusCode === 200, 'OPTIONSリクエストが成功');
    assert(response.headers['access-control-allow-origin'] !== undefined, 'CORS Originヘッダーが存在');
    assert(response.headers['access-control-allow-methods'] !== undefined, 'CORS Methodsヘッダーが存在');
    
  } catch (error) {
    log.error(`CORSテストでエラー: ${error.message}`);
    testStats.failed++;
  }
}

// メイン実行関数
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('🔐 SimpleLDAP External API Test Suite');
  console.log('==========================================');
  console.log(`${colors.reset}`);
  
  log.info(`テスト対象: ${CONFIG.baseUrl}`);
  log.info(`APIキー: ${CONFIG.apiKey}`);
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // サーバーが起動しているかチェック
    log.info('サーバー接続確認中...');
    await apiRequest('/employees', { apiKey: CONFIG.apiKey });
    log.success('サーバーに接続しました');
    
    // 各テストを実行
    await testAuthenticationAPI();
    await testEmployeesAPI();
    await testEmployeeDetailAPI();
    await testOrganizationAPI();
    await testDepartmentsAPI();
    await testAuthenticationErrors();
    await testRateLimit();
    await testCORS();
    
  } catch (error) {
    log.error(`サーバーに接続できません: ${error.message}`);
    log.warn('開発サーバーが起動していることを確認してください (npm run dev)');
    process.exit(1);
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // 結果表示
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}テスト結果${colors.reset}`);
  console.log('='.repeat(60));
  
  console.log(`総テスト数: ${testStats.total}`);
  console.log(`${colors.green}成功: ${testStats.passed}${colors.reset}`);
  console.log(`${colors.red}失敗: ${testStats.failed}${colors.reset}`);
  console.log(`実行時間: ${duration}秒`);
  
  if (testStats.failed > 0) {
    console.log(`\n${colors.red}失敗したテスト:${colors.reset}`);
    testStats.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  const successRate = ((testStats.passed / testStats.total) * 100).toFixed(1);
  console.log(`\n成功率: ${successRate}%`);
  
  if (testStats.failed === 0) {
    console.log(`\n${colors.green}${colors.bright}🎉 すべてのテストが成功しました！${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}${colors.bright}❌ 一部のテストが失敗しました${colors.reset}`);
    process.exit(1);
  }
}

// 実行
if (require.main === module) {
  runAllTests().catch((error) => {
    log.error(`予期しないエラー: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testStats
};