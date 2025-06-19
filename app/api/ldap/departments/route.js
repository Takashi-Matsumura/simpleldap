import { NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const UserManager = require('../../../../lib/user-manager');

const userManager = new UserManager();

// GET: 部署一覧の取得
export async function GET() {
  try {
    const users = userManager.getAllUsers();
    
    // 部署別統計
    const departments = {};
    const divisions = {};
    
    Object.entries(users).forEach(([email, user]) => {
      const dept = user.attributes.department;
      const div = user.attributes.division;
      const employeeType = user.attributes.employeeType;
      const role = user.attributes.role;
      
      if (dept) {
        if (!departments[dept]) {
          departments[dept] = {
            name: dept,
            division: div || '未分類',
            totalEmployees: 0,
            employeeTypes: {},
            roles: {},
            employees: []
          };
        }
        
        departments[dept].totalEmployees++;
        departments[dept].employeeTypes[employeeType] = (departments[dept].employeeTypes[employeeType] || 0) + 1;
        departments[dept].roles[role] = (departments[dept].roles[role] || 0) + 1;
        departments[dept].employees.push({
          email,
          name: user.attributes.cn,
          title: user.attributes.title,
          employeeNumber: user.attributes.employeeNumber,
          employeeType,
          role
        });
      }
      
      if (div) {
        if (!divisions[div]) {
          divisions[div] = {
            name: div,
            totalEmployees: 0,
            departments: new Set(),
            employeeTypes: {},
            roles: {}
          };
        }
        
        divisions[div].totalEmployees++;
        divisions[div].departments.add(dept || '未分類');
        divisions[div].employeeTypes[employeeType] = (divisions[div].employeeTypes[employeeType] || 0) + 1;
        divisions[div].roles[role] = (divisions[div].roles[role] || 0) + 1;
      }
    });

    // Set を Array に変換
    Object.values(divisions).forEach(division => {
      division.departments = Array.from(division.departments);
    });

    return NextResponse.json({
      success: true,
      departments: Object.values(departments),
      divisions: Object.values(divisions),
      summary: {
        totalDepartments: Object.keys(departments).length,
        totalDivisions: Object.keys(divisions).length,
        totalEmployees: Object.keys(users).length
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}