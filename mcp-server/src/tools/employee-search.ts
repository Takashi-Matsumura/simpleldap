// Employee Search MCP Tool

import { z } from 'zod';
import { SimpleLDAPClient } from '../api-client.js';

export const employeeSearchSchema = z.object({
  query: z.string().optional().describe('検索キーワード（名前、メールアドレス、社員番号）'),
  department: z.string().optional().describe('部署でフィルタリング（例: 営業部、人事部）'),
  division: z.string().optional().describe('部門でフィルタリング（例: 営業本部、管理本部）'),
  role: z.string().optional().describe('役職でフィルタリング（admin, manager, employee）'),
  limit: z.number().min(1).max(100).default(10).describe('結果の最大件数（1-100）')
});

export type EmployeeSearchInput = z.infer<typeof employeeSearchSchema>;

export async function searchEmployees(
  client: SimpleLDAPClient,
  input: EmployeeSearchInput
): Promise<string> {
  try {
    const result = await client.searchEmployees({
      query: input.query,
      department: input.department,
      division: input.division,
      role: input.role,
      limit: input.limit,
      page: 1
    });

    if (result.employees.length === 0) {
      return '検索条件に一致する社員が見つかりませんでした。';
    }

    // Format the results for Claude
    let output = `## 社員検索結果\n\n`;
    output += `**検索結果**: ${result.employees.length}件 / 全${result.pagination.total}件\n\n`;

    // Add filter information if any
    const activeFilters = [];
    if (input.query) activeFilters.push(`検索: "${input.query}"`);
    if (input.department) activeFilters.push(`部署: ${input.department}`);
    if (input.division) activeFilters.push(`部門: ${input.division}`);
    if (input.role) activeFilters.push(`権限: ${input.role}`);
    
    if (activeFilters.length > 0) {
      output += `**適用フィルタ**: ${activeFilters.join(', ')}\n\n`;
    }

    // Format each employee
    result.employees.forEach((employee, index) => {
      output += `### ${index + 1}. ${employee.cn}\n`;
      output += `- **メール**: ${employee.email}\n`;
      output += `- **社員番号**: ${employee.employeeNumber}\n`;
      output += `- **部署**: ${employee.department}\n`;
      output += `- **部門**: ${employee.division}\n`;
      output += `- **役職**: ${employee.title}\n`;
      output += `- **雇用形態**: ${employee.employeeType}\n`;
      output += `- **システム権限**: ${employee.role}\n`;
      
      if (employee.telephoneNumber) {
        output += `- **内線**: ${employee.telephoneNumber}\n`;
      }
      
      if (employee.mobile) {
        output += `- **携帯**: ${employee.mobile}\n`;
      }
      
      if (employee.physicalDeliveryOfficeName) {
        output += `- **勤務地**: ${employee.physicalDeliveryOfficeName}\n`;
      }
      
      if (employee.hireDate) {
        output += `- **入社日**: ${employee.hireDate}\n`;
      }

      output += '\n';
    });

    // Add pagination info if there are more results
    if (result.pagination.hasNext) {
      output += `\n📋 **注意**: 更に${result.pagination.total - result.employees.length}件の結果があります。より具体的な検索条件で絞り込むか、特定の社員の詳細情報が必要な場合は get_employee_details ツールを使用してください。\n`;
    }

    return output;

  } catch (error) {
    if (error instanceof Error) {
      return `❌ エラー: 社員検索中にエラーが発生しました - ${error.message}`;
    }
    return '❌ エラー: 予期しないエラーが発生しました';
  }
}