/**
 * Tool registry for dynamic tool management
 */

import { z, ZodSchema } from 'zod';
import { SimpleLDAPClient } from '../api-client.js';
import { TOOL_NAMES } from '../constants.js';

// Import tool implementations
import { searchEmployees, employeeSearchSchema } from './employee-search.js';
import { getEmployeeDetails, employeeDetailsSchema } from './employee-details.js';
import { getOrganizationStructure, organizationStructureSchema } from './organization.js';
import { getDepartmentInfo, departmentInfoSchema } from './department.js';
import { verifyEmployeeAuth, authVerifySchema } from './auth-verify.js';
import { getCompanyStatistics, companyStatisticsSchema } from './statistics.js';

export interface ToolHandler {
  schema: ZodSchema;
  handler: (client: SimpleLDAPClient, args: any) => Promise<string>;
  description: string;
  inputSchema: Record<string, any>; // JSON Schema format
}

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools = new Map<string, ToolHandler>();
  
  private constructor() {
    this.registerDefaultTools();
  }
  
  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }
  
  private registerDefaultTools(): void {
    // Search Employees
    this.register(TOOL_NAMES.SEARCH_EMPLOYEES, {
      schema: employeeSearchSchema,
      handler: searchEmployees,
      description: '社員を検索します。名前、部署、部門、役職などで条件を指定できます。',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '検索キーワード（名前、メールアドレス、社員番号）' },
          department: { type: 'string', description: '部署でフィルタリング（例: 営業部、人事部）' },
          division: { type: 'string', description: '部門でフィルタリング（例: 営業本部、管理本部）' },
          role: { type: 'string', description: '役職でフィルタリング（admin, manager, employee）' },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 10, description: '結果の最大件数（1-100）' }
        }
      }
    });
    
    // Get Employee Details
    this.register(TOOL_NAMES.GET_EMPLOYEE_DETAILS, {
      schema: employeeDetailsSchema,
      handler: getEmployeeDetails,
      description: '特定の社員の詳細情報を取得します。社員IDまたはメールアドレスを指定してください。',
      inputSchema: {
        type: 'object',
        properties: {
          employee_id: { type: 'string', description: '社員IDまたはメールアドレス（例: EMP001 または tanaka.sales@company.com）' }
        },
        required: ['employee_id']
      }
    });
    
    // Get Organization Structure
    this.register(TOOL_NAMES.GET_ORGANIZATION_STRUCTURE, {
      schema: organizationStructureSchema,
      handler: getOrganizationStructure,
      description: '会社の組織構造と管理階層を取得します。部門・部署の構成と管理関係を確認できます。',
      inputSchema: {
        type: 'object',
        properties: {
          include_hierarchy: { type: 'boolean', default: true, description: '管理階層ツリーを含めるか（true: 含める, false: 部門情報のみ）' }
        }
      }
    });
    
    // Get Department Info
    this.register(TOOL_NAMES.GET_DEPARTMENT_INFO, {
      schema: departmentInfoSchema,
      handler: getDepartmentInfo,
      description: '特定の部署の詳細情報と所属社員を取得します。部署名を指定してください。',
      inputSchema: {
        type: 'object',
        properties: {
          department_name: { type: 'string', description: '部署名（例: 営業部、人事部、IT部）' }
        },
        required: ['department_name']
      }
    });
    
    // Verify Employee Auth
    this.register(TOOL_NAMES.VERIFY_EMPLOYEE_AUTH, {
      schema: authVerifySchema,
      handler: verifyEmployeeAuth,
      description: '社員の認証情報を確認します。メールアドレスとパスワードで認証をテストできます。',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email', description: 'メールアドレス' },
          password: { type: 'string', description: 'パスワード（注意: 実際のパスワードは慎重に扱ってください）' }
        },
        required: ['email', 'password']
      }
    });
    
    // Get Company Statistics
    this.register(TOOL_NAMES.GET_COMPANY_STATISTICS, {
      schema: companyStatisticsSchema,
      handler: getCompanyStatistics,
      description: '会社全体の統計情報を取得します。従業員数、部署数、部門別統計などを確認できます。',
      inputSchema: {
        type: 'object',
        properties: {
          include_departments: { type: 'boolean', default: true, description: '部署別の詳細統計を含めるか' }
        }
      }
    });
  }
  
  register(name: string, handler: ToolHandler): void {
    this.tools.set(name, handler);
  }
  
  get(name: string): ToolHandler | undefined {
    return this.tools.get(name);
  }
  
  has(name: string): boolean {
    return this.tools.has(name);
  }
  
  getAll(): Map<string, ToolHandler> {
    return new Map(this.tools);
  }
  
  getToolDefinitions(): Array<{ name: string; description: string; inputSchema: any }> {
    return Array.from(this.tools.entries()).map(([name, handler]) => ({
      name,
      description: handler.description,
      inputSchema: handler.inputSchema
    }));
  }
  
  async execute(
    name: string,
    client: SimpleLDAPClient,
    args: unknown
  ): Promise<string> {
    const handler = this.get(name);
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }
    
    const validatedArgs = handler.schema.parse(args);
    return handler.handler(client, validatedArgs);
  }
}