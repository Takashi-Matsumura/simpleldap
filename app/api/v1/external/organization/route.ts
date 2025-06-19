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

// GET: 組織構造取得
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
    const users = userManager.getAllUsers();
    
    if (!users || Object.keys(users).length === 0) {
      return createApiSuccessResponse({
        divisions: [],
        totalEmployees: 0,
        managementHierarchy: []
      }, authResult);
    }
    
    // 部門・部署別の組織構造を構築
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const divisions: Record<string, any> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employeeMap: Record<string, any> = {};
    
    // 全社員をマップに格納
    Object.entries(users).forEach(([email, user]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userAny = user as any;
      employeeMap[email] = {
        email,
        name: userAny.attributes.cn,
        title: userAny.attributes.title,
        department: userAny.attributes.department,
        division: userAny.attributes.division,
        employeeNumber: userAny.attributes.employeeNumber,
        employeeType: userAny.attributes.employeeType,
        role: userAny.attributes.role,
        subordinates: []
      };
    });
    
    // 管理関係の構築
    Object.entries(users).forEach(([email, user]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userAny = user as any;
      if (userAny.attributes.manager) {
        // マネージャーのDNから実際の人物を特定
        const managerDn = userAny.attributes.manager;
        const cnMatch = managerDn.match(/cn=([^,]+)/);
        if (cnMatch) {
          const managerCn = cnMatch[1];
          for (const [managerEmail, emp] of Object.entries(employeeMap)) {
            if (emp.name === managerCn) {
              employeeMap[managerEmail].subordinates.push(employeeMap[email]);
              break;
            }
          }
        }
      }
    });
    
    // 部門・部署別にグループ化
    Object.values(employeeMap).forEach((employee) => {
      const divisionName = employee.division || '未分類';
      const departmentName = employee.department || '未分類';
      
      if (!divisions[divisionName]) {
        divisions[divisionName] = {
          name: divisionName,
          departments: [],
          employeeCount: 0
        };
      }
      
      let department = divisions[divisionName].departments.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: any) => d.name === departmentName
      );
      
      if (!department) {
        department = {
          name: departmentName,
          employeeCount: 0,
          manager: null,
          employees: []
        };
        divisions[divisionName].departments.push(department);
      }
      
      department.employees.push({
        name: employee.name,
        title: employee.title,
        employeeNumber: employee.employeeNumber
      });
      
      department.employeeCount++;
      divisions[divisionName].employeeCount++;
      
      // 部署のマネージャーを特定
      if (employee.subordinates.length > 0 && employee.title?.includes('部長')) {
        department.manager = {
          name: employee.name,
          email: employee.email,
          employeeNumber: employee.employeeNumber
        };
      }
    });
    
    // トップレベルマネージャーを特定
    const topManagers = Object.values(employeeMap).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      emp => !(users as any)[emp.email]?.attributes.manager && emp.subordinates.length > 0
    );
    
    // 管理階層ツリーの構築
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buildHierarchy = (manager: any): any => {
      return {
        name: manager.name,
        title: manager.title,
        department: manager.department,
        employeeNumber: manager.employeeNumber,
        subordinatesCount: manager.subordinates.length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subordinates: manager.subordinates.map((sub: any) => buildHierarchy(sub))
      };
    };
    
    const managementHierarchy = topManagers.map(manager => buildHierarchy(manager));
    
    // レスポンスデータの構築
    const responseData = {
      divisions: Object.values(divisions).map(division => ({
        name: division.name,
        employeeCount: division.employeeCount,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        departments: division.departments.map((dept: any) => ({
          name: dept.name,
          employeeCount: dept.employeeCount,
          manager: dept.manager
        }))
      })),
      totalEmployees: Object.keys(users).length,
      totalDivisions: Object.keys(divisions).length,
      totalDepartments: Object.values(divisions).reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (acc: number, div: any) => acc + div.departments.length, 0
      ),
      managementHierarchy: filterSensitiveData(managementHierarchy)
    };
    
    return createApiSuccessResponse(responseData, authResult);
    
  } catch (error) {
    console.error('Organization error:', error);
    return createApiErrorResponse(
      'INTERNAL_ERROR',
      'An error occurred while fetching organization structure',
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