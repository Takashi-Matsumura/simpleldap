import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { 
  createApiSuccessResponse, 
  createApiErrorResponse,
  filterSensitiveData
} from '@/lib/external-api-utils';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const UserManager = require('@/lib/user-manager');

const userManager = new UserManager();

// GET: 部署詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
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
    const resolvedParams = await params;
    const departmentName = decodeURIComponent(resolvedParams.name);
    const users = userManager.getAllUsers();
    
    // 部署に所属する社員を抽出
    const departmentEmployees = Object.entries(users)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter(([, user]) => (user as any).attributes.department === departmentName)
      .map(([email, user]) => ({
        email,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(user as any).attributes
      }));
    
    if (departmentEmployees.length === 0) {
      return createApiErrorResponse(
        'NOT_FOUND',
        `Department "${departmentName}" not found`,
        404,
        authResult
      );
    }
    
    // 部署のマネージャーを特定
    const managers = departmentEmployees.filter(emp => 
      emp.role === 'manager' || emp.title?.includes('部長')
    );
    
    // 部署の統計情報
    const stats = {
      totalEmployees: departmentEmployees.length,
      managers: departmentEmployees.filter(emp => emp.role === 'manager').length,
      employees: departmentEmployees.filter(emp => emp.role === 'employee').length,
      admins: departmentEmployees.filter(emp => emp.role === 'admin').length,
      employeeTypes: {} as Record<string, number>,
      titles: {} as Record<string, number>
    };
    
    // 雇用形態と役職の集計
    departmentEmployees.forEach(emp => {
      const empType = emp.employeeType || '不明';
      stats.employeeTypes[empType] = (stats.employeeTypes[empType] || 0) + 1;
      
      if (emp.title) {
        stats.titles[emp.title] = (stats.titles[emp.title] || 0) + 1;
      }
    });
    
    // 平均勤続年数の計算
    const hireDates = departmentEmployees
      .map(emp => emp.hireDate)
      .filter(date => date)
      .map(date => new Date(date));
    
    let averageYearsOfService = 0;
    if (hireDates.length > 0) {
      const currentDate = new Date();
      const totalYears = hireDates.reduce((sum, date) => {
        return sum + (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
      }, 0);
      averageYearsOfService = Math.round(totalYears / hireDates.length * 10) / 10;
    }
    
    // 部門情報の取得
    const division = departmentEmployees[0]?.division || '未分類';
    
    // 社員リストの構築（センシティブ情報を除外）
    const employeeList = departmentEmployees.map(emp => ({
      employeeNumber: emp.employeeNumber,
      email: emp.email,
      name: emp.cn,
      title: emp.title,
      role: emp.role,
      employeeType: emp.employeeType,
      hireDate: emp.hireDate
    }));
    
    // レスポンスデータ
    const responseData = {
      department: {
        name: departmentName,
        division: division,
        manager: managers.length > 0 ? {
          name: managers[0].cn,
          email: managers[0].email,
          employeeNumber: managers[0].employeeNumber
        } : null,
        statistics: {
          ...stats,
          averageYearsOfService
        },
        employees: filterSensitiveData(employeeList)
      }
    };
    
    return createApiSuccessResponse(responseData, authResult);
    
  } catch (error) {
    console.error('Department detail error:', error);
    return createApiErrorResponse(
      'INTERNAL_ERROR',
      'An error occurred while fetching department details',
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