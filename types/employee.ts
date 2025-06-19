// 従業員情報の型定義
export interface EmployeeAttributes {
  mail: string;
  cn: string;
  givenName?: string;
  sn?: string;
  role: 'admin' | 'manager' | 'employee';
  objectClass: string[];
  
  // 社員情報
  employeeNumber?: string;
  department?: string;
  division?: string;
  title?: string;
  manager?: string;
  employeeType?: '正社員' | '契約社員' | '役員';
  
  // 連絡先
  telephoneNumber?: string;
  mobile?: string;
  physicalDeliveryOfficeName?: string;
  postalAddress?: string;
  
  // その他
  costCenter?: string;
  hireDate?: string;
  jobCode?: string;
  contractEndDate?: string;
  certifications?: string[];
}

export interface Employee {
  email: string;
  dn: string;
  password: string;
  attributes: EmployeeAttributes;
}

export interface EmployeeStats {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
}

export interface NewEmployeeForm {
  email: string;
  password: string;
  cn: string;
  givenName: string;
  sn: string;
  telephoneNumber: string;
  role: 'admin' | 'manager' | 'employee';
  
  // 社員情報
  employeeNumber: string;
  department: string;
  division: string;
  title: string;
  manager: string;
  employeeType: '正社員' | '契約社員' | '役員';
  mobile: string;
  physicalDeliveryOfficeName: string;
  costCenter: string;
  hireDate: string;
  jobCode: string;
}

export interface AuthTestForm {
  email: string;
  password: string;
  result: AuthResult | null;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: Employee;
}

// 組織関連の型定義
export interface OrganizationEmployee {
  email: string;
  dn: string;
  name: string;
  title?: string;
  department?: string;
  division?: string;
  manager?: string;
  employeeNumber?: string;
  employeeType?: string;
  role: string;
  subordinates: OrganizationEmployee[];
}

export interface Department {
  name: string;
  employees: OrganizationEmployee[];
  managers: OrganizationEmployee[];
  subordinates: OrganizationEmployee[];
}

export interface Division {
  name: string;
  departments: Record<string, Department>;
  totalEmployees: number;
}

export interface OrganizationData {
  success: boolean;
  organization: Record<string, Division>;
  managementTree: OrganizationEmployee[];
  statistics: {
    totalEmployees: number;
    totalDivisions: number;
    totalDepartments: number;
    totalManagers: number;
  };
}

export interface DepartmentStats {
  totalEmployees: number;
  managers: number;
  employees: number;
  averageYears: number;
}

export interface DepartmentStatsResponse {
  success: boolean;
  departmentStats: Record<string, DepartmentStats>;
  divisionStats: Record<string, DepartmentStats>;
}