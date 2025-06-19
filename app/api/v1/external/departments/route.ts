import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { 
  createApiSuccessResponse, 
  createApiErrorResponse,
  parseQueryParams
} from '@/lib/external-api-utils';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const UserManager = require('@/lib/user-manager');

const userManager = new UserManager();

// GET: 部署一覧・統計
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
    const params = parseQueryParams(request.url);
    const users = userManager.getAllUsers();
    
    // 部署・部門ごとの統計を計算
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const departmentStats: Record<string, any> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const divisionStats: Record<string, any> = {};
    
    Object.values(users).forEach((user) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userAny = user as any;
      const dept = userAny.attributes.department || '未分類';
      const div = userAny.attributes.division || '未分類';
      const role = userAny.attributes.role;
      const hireDate = userAny.attributes.hireDate;
      
      // 部署統計
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          name: dept,
          division: div,
          totalEmployees: 0,
          managers: 0,
          employees: 0,
          admins: 0,
          employeeTypes: {},
          hireDates: []
        };
      }
      
      departmentStats[dept].totalEmployees++;
      if (role === 'manager') departmentStats[dept].managers++;
      else if (role === 'admin') departmentStats[dept].admins++;
      else departmentStats[dept].employees++;
      
      // 雇用形態の集計
      const empType = userAny.attributes.employeeType || '不明';
      departmentStats[dept].employeeTypes[empType] = 
        (departmentStats[dept].employeeTypes[empType] || 0) + 1;
      
      // 入社日を記録（平均勤続年数計算用）
      if (hireDate) {
        departmentStats[dept].hireDates.push(new Date(hireDate));
      }
      
      // 部門統計
      if (!divisionStats[div]) {
        divisionStats[div] = {
          name: div,
          departments: new Set(),
          totalEmployees: 0
        };
      }
      
      divisionStats[div].departments.add(dept);
      divisionStats[div].totalEmployees++;
    });
    
    // 平均勤続年数を計算
    const currentDate = new Date();
    Object.values(departmentStats).forEach((dept) => {
      if (dept.hireDates.length > 0) {
        const totalYears = dept.hireDates.reduce((sum: number, date: Date) => {
          return sum + (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
        }, 0);
        dept.averageYearsOfService = Math.round(totalYears / dept.hireDates.length * 10) / 10;
      } else {
        dept.averageYearsOfService = 0;
      }
      delete dept.hireDates; // 個別の日付は削除
    });
    
    // 部門情報を整形
    const divisionsArray = Object.values(divisionStats).map(div => ({
      name: div.name,
      departmentCount: div.departments.size,
      departments: Array.from(div.departments),
      totalEmployees: div.totalEmployees
    }));
    
    // フィルタリング（部門指定がある場合）
    let departmentsArray = Object.values(departmentStats);
    if (params.division) {
      departmentsArray = departmentsArray.filter(dept => dept.division === params.division);
    }
    
    // レスポンスデータ
    const responseData = {
      departments: departmentsArray.map(dept => ({
        name: dept.name,
        division: dept.division,
        statistics: {
          totalEmployees: dept.totalEmployees,
          managers: dept.managers,
          employees: dept.employees,
          admins: dept.admins,
          averageYearsOfService: dept.averageYearsOfService,
          employeeTypes: dept.employeeTypes
        }
      })),
      divisions: divisionsArray,
      summary: {
        totalDepartments: departmentsArray.length,
        totalDivisions: divisionsArray.length,
        totalEmployees: Object.keys(users).length
      }
    };
    
    return createApiSuccessResponse(responseData, authResult);
    
  } catch (error) {
    console.error('Departments error:', error);
    return createApiErrorResponse(
      'INTERNAL_ERROR',
      'An error occurred while fetching departments',
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