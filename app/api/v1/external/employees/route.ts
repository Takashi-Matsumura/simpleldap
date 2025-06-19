import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { 
  createApiSuccessResponse, 
  createApiErrorResponse, 
  filterSensitiveData,
  calculatePagination,
  parseQueryParams
} from '@/lib/external-api-utils';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const UserManager = require('@/lib/user-manager');

const userManager = new UserManager();

// GET: 社員一覧・検索
export async function GET(request: NextRequest) {
  // API認証
  const authResult = authenticateRequest(request);
  if (!authResult.authenticated) {
    return createApiErrorResponse(
      'UNAUTHORIZED',
      authResult.error || 'Authentication required',
      401,
      authResult
    );
  }
  
  try {
    // クエリパラメータの解析
    const params = parseQueryParams(request.url);
    
    // 全ユーザーを取得
    const allUsers = userManager.getAllUsers();
    let employees = Object.entries(allUsers).map(([email, user]) => ({
      email,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(user as any).attributes,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      employeeId: (user as any).attributes.employeeNumber // エイリアスを追加
    }));
    
    // フィルタリング
    if (params.department) {
      employees = employees.filter(emp => emp.department === params.department);
    }
    if (params.division) {
      employees = employees.filter(emp => emp.division === params.division);
    }
    if (params.title) {
      employees = employees.filter(emp => emp.title === params.title);
    }
    if (params.employeeType) {
      employees = employees.filter(emp => emp.employeeType === params.employeeType);
    }
    if (params.role) {
      employees = employees.filter(emp => emp.role === params.role);
    }
    
    // 検索
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      employees = employees.filter(emp => 
        emp.cn?.toLowerCase().includes(searchLower) ||
        emp.email?.toLowerCase().includes(searchLower) ||
        emp.employeeNumber?.toLowerCase().includes(searchLower) ||
        emp.department?.toLowerCase().includes(searchLower) ||
        emp.title?.toLowerCase().includes(searchLower)
      );
    }
    
    // ソート
    employees.sort((a, b) => {
      let aVal = a[params.sortBy] || '';
      let bVal = b[params.sortBy] || '';
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (params.sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });
    
    // ページネーション情報
    const pagination = calculatePagination(employees.length, params.page, params.limit);
    
    // ページネーション適用
    const startIndex = (params.page - 1) * params.limit;
    const paginatedEmployees = employees.slice(startIndex, startIndex + params.limit);
    
    // センシティブ情報のフィルタリング
    const filteredEmployees = filterSensitiveData(paginatedEmployees);
    
    // フィールド選択
    let finalEmployees = filteredEmployees;
    if (params.fields && params.fields.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      finalEmployees = (filteredEmployees as any[]).map(emp => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const selected: any = {};
        params.fields!.forEach(field => {
          if (emp[field] !== undefined) {
            selected[field] = emp[field];
          }
        });
        return selected;
      });
    }
    
    return createApiSuccessResponse({
      employees: finalEmployees,
      pagination,
      filters: {
        department: params.department,
        division: params.division,
        title: params.title,
        employeeType: params.employeeType,
        role: params.role,
        search: params.search
      }
    }, authResult);
    
  } catch (error) {
    console.error('Employee list error:', error);
    return createApiErrorResponse(
      'INTERNAL_ERROR',
      'An error occurred while fetching employees',
      500,
      authResult
    );
  }
}

// OPTIONS: CORS対応
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'X-API-Key, Authorization, Content-Type');
  return response;
}