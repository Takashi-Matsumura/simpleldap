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

// GET: 社員詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const employeeId = resolvedParams.id;
    
    // 全ユーザーから対象を検索
    const allUsers = userManager.getAllUsers();
    let foundUser = null;
    let foundEmail = null;
    
    // 社員番号またはメールアドレスで検索
    for (const [email, user] of Object.entries(allUsers)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userAny = user as any;
      if (userAny.attributes.employeeNumber === employeeId || email === employeeId) {
        foundUser = userAny;
        foundEmail = email;
        break;
      }
    }
    
    if (!foundUser) {
      return createApiErrorResponse(
        'NOT_FOUND',
        `Employee with ID ${employeeId} not found`,
        404,
        authResult
      );
    }
    
    // マネージャー情報の取得
    let managerInfo = null;
    if (foundUser.attributes.manager) {
      // マネージャーのDNから実際の情報を取得
      const managerDn = foundUser.attributes.manager;
      const cnMatch = managerDn.match(/cn=([^,]+)/);
      if (cnMatch) {
        const managerCn = cnMatch[1];
        for (const [email, user] of Object.entries(allUsers)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const userAny = user as any;
          if (userAny.attributes.cn === managerCn) {
            managerInfo = {
              email,
              name: userAny.attributes.cn,
              employeeNumber: userAny.attributes.employeeNumber,
              title: userAny.attributes.title
            };
            break;
          }
        }
      }
    }
    
    // 部下の情報を取得
    const subordinates = [];
    const userCn = foundUser.attributes.cn;
    for (const [email, user] of Object.entries(allUsers)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userAny = user as any;
      if (userAny.attributes.manager && userAny.attributes.manager.includes(`cn=${userCn}`)) {
        subordinates.push({
          email,
          name: userAny.attributes.cn,
          employeeNumber: userAny.attributes.employeeNumber,
          title: userAny.attributes.title,
          department: userAny.attributes.department
        });
      }
    }
    
    // レスポンスデータの構築
    const employeeData = {
      employeeNumber: foundUser.attributes.employeeNumber,
      email: foundEmail,
      name: foundUser.attributes.cn,
      givenName: foundUser.attributes.givenName,
      surname: foundUser.attributes.sn,
      department: foundUser.attributes.department,
      division: foundUser.attributes.division,
      title: foundUser.attributes.title,
      role: foundUser.attributes.role,
      employeeType: foundUser.attributes.employeeType,
      telephoneNumber: foundUser.attributes.telephoneNumber,
      mobile: foundUser.attributes.mobile,
      physicalDeliveryOfficeName: foundUser.attributes.physicalDeliveryOfficeName,
      hireDate: foundUser.attributes.hireDate,
      jobCode: foundUser.attributes.jobCode,
      manager: managerInfo,
      subordinates: subordinates,
      subordinatesCount: subordinates.length
    };
    
    // センシティブ情報のフィルタリング
    const filteredData = filterSensitiveData(employeeData);
    
    return createApiSuccessResponse({
      employee: filteredData
    }, authResult);
    
  } catch (error) {
    console.error('Employee detail error:', error);
    return createApiErrorResponse(
      'INTERNAL_ERROR',
      'An error occurred while fetching employee details',
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