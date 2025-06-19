// SimpleLDAP MCP Server Type Definitions

export interface Employee {
  email: string;
  cn: string;
  givenName?: string;
  sn?: string;
  role: 'admin' | 'manager' | 'employee';
  employeeNumber: string;
  department: string;
  division: string;
  title: string;
  manager?: string;
  employeeType: string;
  telephoneNumber?: string;
  mobile?: string;
  physicalDeliveryOfficeName?: string;
  hireDate?: string;
  jobCode?: string;
  employeeId: string;
  subordinatesCount?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface EmployeeListResponse {
  employees: Employee[];
  pagination: PaginationInfo;
  filters: {
    department?: string | null;
    division?: string | null;
    title?: string | null;
    employeeType?: string | null;
    role?: string | null;
    search?: string | null;
  };
}

export interface EmployeeDetailResponse {
  employee: Employee & {
    manager?: {
      name: string;
      email: string;
      employeeNumber: string;
    };
    subordinates?: Array<{
      name: string;
      email: string;
      employeeNumber: string;
      title: string;
    }>;
  };
}

export interface Division {
  name: string;
  employeeCount: number;
  departments: Department[];
}

export interface Department {
  name: string;
  employeeCount: number;
  manager?: {
    name: string;
    email: string;
    employeeNumber: string;
  };
}

export interface OrganizationResponse {
  divisions: Division[];
  totalEmployees: number;
  totalDivisions: number;
  totalDepartments: number;
  managementHierarchy: ManagementNode[];
}

export interface ManagementNode {
  name: string;
  title: string;
  department: string;
  employeeNumber: string;
  subordinatesCount: number;
  subordinates: ManagementNode[];
}

export interface DepartmentDetailResponse {
  department: {
    name: string;
    division: string;
    statistics: {
      totalEmployees: number;
      managers: number;
      averageYearsOfService: number;
    };
    manager?: {
      name: string;
      email: string;
      employeeNumber: string;
    };
  };
  employees: Employee[];
}

export interface AuthVerifyResponse {
  authenticated: boolean;
  employee?: Employee;
}

export interface SimpleLDAPClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

export interface MCPServerConfig {
  simpleldap: SimpleLDAPClientConfig;
  server: {
    name: string;
    version: string;
  };
}