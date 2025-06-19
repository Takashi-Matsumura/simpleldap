#!/usr/bin/env node

/**
 * SimpleLDAP MCP Server
 * 
 * Claude Desktop integration for SimpleLDAP Employee Management System
 * Provides tools for searching employees, viewing organization structure,
 * and accessing company information through MCP (Model Context Protocol).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { SimpleLDAPClient } from './api-client.js';
import { MCPServerConfig } from './types.js';

// Import tool implementations
import { searchEmployees, employeeSearchSchema } from './tools/employee-search.js';
import { getEmployeeDetails, employeeDetailsSchema } from './tools/employee-details.js';
import { getOrganizationStructure, organizationStructureSchema } from './tools/organization.js';
import { getDepartmentInfo, departmentInfoSchema } from './tools/department.js';
import { verifyEmployeeAuth, authVerifySchema } from './tools/auth-verify.js';
import { getCompanyStatistics, companyStatisticsSchema } from './tools/statistics.js';

// Server configuration
const SERVER_CONFIG: MCPServerConfig = {
  simpleldap: {
    baseUrl: process.env.SIMPLELDAP_API_URL || 'http://localhost:3000',
    apiKey: process.env.SIMPLELDAP_API_KEY || 'test-api-key-1',
    timeout: parseInt(process.env.SIMPLELDAP_TIMEOUT || '10000')
  },
  server: {
    name: 'simpleldap-mcp-server',
    version: '1.0.0'
  }
};

// Initialize SimpleLDAP API client
const simpleldapClient = new SimpleLDAPClient(SERVER_CONFIG.simpleldap);

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'search_employees',
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
  },
  {
    name: 'get_employee_details',
    description: '特定の社員の詳細情報を取得します。社員IDまたはメールアドレスを指定してください。',
    inputSchema: {
      type: 'object',
      properties: {
        employee_id: { type: 'string', description: '社員IDまたはメールアドレス（例: EMP001 または tanaka.sales@company.com）' }
      },
      required: ['employee_id']
    }
  },
  {
    name: 'get_organization_structure',
    description: '会社の組織構造と管理階層を取得します。部門・部署の構成と管理関係を確認できます。',
    inputSchema: {
      type: 'object',
      properties: {
        include_hierarchy: { type: 'boolean', default: true, description: '管理階層ツリーを含めるか（true: 含める, false: 部門情報のみ）' }
      }
    }
  },
  {
    name: 'get_department_info',
    description: '特定の部署の詳細情報と所属社員を取得します。部署名を指定してください。',
    inputSchema: {
      type: 'object',
      properties: {
        department_name: { type: 'string', description: '部署名（例: 営業部、人事部、IT部）' }
      },
      required: ['department_name']
    }
  },
  {
    name: 'verify_employee_auth',
    description: '社員の認証情報を確認します。メールアドレスとパスワードで認証をテストできます。',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', description: 'メールアドレス' },
        password: { type: 'string', description: 'パスワード（注意: 実際のパスワードは慎重に扱ってください）' }
      },
      required: ['email', 'password']
    }
  },
  {
    name: 'get_company_statistics',
    description: '会社全体の統計情報を取得します。従業員数、部署数、部門別統計などを確認できます。',
    inputSchema: {
      type: 'object',
      properties: {
        include_departments: { type: 'boolean', default: true, description: '部署別の詳細統計を含めるか' }
      }
    }
  }
];

// Create MCP server
const server = new Server(
  {
    name: SERVER_CONFIG.server.name,
    version: SERVER_CONFIG.server.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_employees': {
        const parsedArgs = employeeSearchSchema.parse(args);
        const result = await searchEmployees(simpleldapClient, parsedArgs);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'get_employee_details': {
        const parsedArgs = employeeDetailsSchema.parse(args);
        const result = await getEmployeeDetails(simpleldapClient, parsedArgs);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'get_organization_structure': {
        const parsedArgs = organizationStructureSchema.parse(args);
        const result = await getOrganizationStructure(simpleldapClient, parsedArgs);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'get_department_info': {
        const parsedArgs = departmentInfoSchema.parse(args);
        const result = await getDepartmentInfo(simpleldapClient, parsedArgs);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'verify_employee_auth': {
        const parsedArgs = authVerifySchema.parse(args);
        const result = await verifyEmployeeAuth(simpleldapClient, parsedArgs);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'get_company_statistics': {
        const parsedArgs = companyStatisticsSchema.parse(args);
        const result = await getCompanyStatistics(simpleldapClient, parsedArgs);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ エラー: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: '❌ 予期しないエラーが発生しました',
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  console.error('🚀 SimpleLDAP MCP Server starting...');
  
  // Test API connectivity on startup
  try {
    const isHealthy = await simpleldapClient.healthCheck();
    if (isHealthy) {
      console.error(`✅ SimpleLDAP API connection successful (${SERVER_CONFIG.simpleldap.baseUrl})`);
    } else {
      console.error(`⚠️ SimpleLDAP API connection failed (${SERVER_CONFIG.simpleldap.baseUrl})`);
      console.error('   Server will start but tools may not work properly.');
    }
  } catch (error) {
    console.error(`⚠️ SimpleLDAP API health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error('   Server will start but tools may not work properly.');
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('📡 SimpleLDAP MCP Server connected and ready!');
  console.error(`🔧 Configuration:`);
  console.error(`   - API URL: ${SERVER_CONFIG.simpleldap.baseUrl}`);
  console.error(`   - API Key: ${SERVER_CONFIG.simpleldap.apiKey.substring(0, 8)}...`);
  console.error(`   - Available tools: ${TOOLS.length}`);
  console.error('\n💡 Available tools:');
  TOOLS.forEach(tool => {
    console.error(`   - ${tool.name}: ${tool.description}`);
  });
}

// Handle process termination
process.on('SIGINT', async () => {
  console.error('\n🛑 SimpleLDAP MCP Server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\n🛑 SimpleLDAP MCP Server shutting down...');
  process.exit(0);
});

// Start the server
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Failed to start SimpleLDAP MCP Server:', error);
    process.exit(1);
  });
}