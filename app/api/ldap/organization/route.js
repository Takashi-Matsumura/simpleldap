import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const UserManager = require('../../../../lib/user-manager');

const userManager = new UserManager();

// GET: 組織図データの取得
export async function GET() {
  try {
    const users = userManager.getAllUsers();
    
    if (!users || Object.keys(users).length === 0) {
      return createApiResponse(true, {
        organization: {},
        managementTree: [],
        statistics: {
          totalEmployees: 0,
          totalDivisions: 0,
          totalDepartments: 0,
          totalManagers: 0
        }
      });
    }
    
    // 組織階層の構築
    const organization = {};
    const employeeMap = {};
    
    // 全社員をマップに格納
    Object.entries(users).forEach(([email, user]) => {
      employeeMap[email] = {
        email,
        dn: user.dn,
        name: user.attributes.cn,
        title: user.attributes.title,
        department: user.attributes.department,
        division: user.attributes.division,
        manager: user.attributes.manager,
        employeeNumber: user.attributes.employeeNumber,
        employeeType: user.attributes.employeeType,
        role: user.attributes.role,
        subordinates: []
      };
    });

    // 管理関係の構築
    Object.values(employeeMap).forEach(employee => {
      if (employee.manager) {
        // managerのDNからemailを逆引き
        const managerEmail = findEmailByDN(employee.manager, employeeMap);
        if (managerEmail && employeeMap[managerEmail]) {
          employeeMap[managerEmail].subordinates.push(employee);
        }
      }
    });

    // 部門・部署別組織構造
    Object.values(employeeMap).forEach(employee => {
      const division = employee.division || '未分類';
      const department = employee.department || '未分類';
      
      if (!organization[division]) {
        organization[division] = {
          name: division,
          departments: {},
          totalEmployees: 0
        };
      }
      
      if (!organization[division].departments[department]) {
        organization[division].departments[department] = {
          name: department,
          employees: [],
          managers: [],
          subordinates: []
        };
      }
      
      organization[division].departments[department].employees.push(employee);
      organization[division].totalEmployees++;
      
      // 管理者の分類
      if (employee.subordinates.length > 0) {
        organization[division].departments[department].managers.push(employee);
      } else {
        organization[division].departments[department].subordinates.push(employee);
      }
    });

    // トップレベル（マネージャーを持たない）の管理者を特定
    const topLevelManagers = Object.values(employeeMap).filter(emp => 
      !emp.manager && emp.subordinates.length > 0
    );

    // 管理階層ツリーの構築
    const managementTree = topLevelManagers.map(manager => 
      buildManagementTree(manager, employeeMap)
    );

    return createApiResponse(true, {
      organization,
      managementTree,
      statistics: {
        totalEmployees: Object.keys(users).length,
        totalDivisions: Object.keys(organization).length,
        totalDepartments: Object.values(organization).reduce(
          (total, division) => total + Object.keys(division.departments).length, 0
        ),
        totalManagers: Object.values(employeeMap).filter(emp => emp.subordinates.length > 0).length
      }
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

// DNからEmailを逆引きする関数
function findEmailByDN(dn, employeeMap) {
  // DN例: "cn=田中社長,ou=users,dc=company,dc=com"
  // cnの値を取得
  const cnMatch = dn.match(/cn=([^,]+)/);
  if (!cnMatch) return null;
  
  const cnValue = cnMatch[1];
  
  // employeeMapから該当するemailを検索
  for (const [email, employee] of Object.entries(employeeMap)) {
    if (employee.name === cnValue) {
      return email;
    }
  }
  return null;
}

// 管理階層ツリーを再帰的に構築
function buildManagementTree(manager, employeeMap) {
  return {
    ...manager,
    subordinates: manager.subordinates.map(subordinate => 
      buildManagementTree(subordinate, employeeMap)
    )
  };
}