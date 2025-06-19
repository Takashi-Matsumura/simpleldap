// Department Information MCP Tool

import { z } from 'zod';
import { SimpleLDAPClient } from '../api-client.js';

export const departmentInfoSchema = z.object({
  department_name: z.string().describe('部署名（例: 営業部、人事部、IT部）')
});

export type DepartmentInfoInput = z.infer<typeof departmentInfoSchema>;

export async function getDepartmentInfo(
  client: SimpleLDAPClient,
  input: DepartmentInfoInput
): Promise<string> {
  try {
    const result = await client.getDepartmentInfo(input.department_name);
    const department = result.department;

    let output = `## ${department.name} 詳細情報\n\n`;

    // Department Statistics
    output += `### 📊 部署統計\n`;
    output += `- **部署名**: ${department.name}\n`;
    output += `- **所属部門**: ${department.division}\n`;
    output += `- **総従業員数**: ${department.statistics.totalEmployees}人\n`;
    output += `- **管理者数**: ${department.statistics.managers}人\n`;
    output += `- **平均勤続年数**: ${department.statistics.averageYearsOfService}年\n\n`;

    // Department Manager
    if (department.manager) {
      output += `### 👑 部署管理者\n`;
      output += `- **管理者**: ${department.manager.name}\n`;
      output += `- **メール**: ${department.manager.email}\n`;
      output += `- **社員番号**: ${department.manager.employeeNumber}\n\n`;
    }

    // Employees List
    if (result.employees.length > 0) {
      output += `### 👥 所属社員一覧 (${result.employees.length}人)\n\n`;
      
      // Group employees by role for better organization
      const groupedEmployees = {
        admin: result.employees.filter(emp => emp.role === 'admin'),
        manager: result.employees.filter(emp => emp.role === 'manager'),
        employee: result.employees.filter(emp => emp.role === 'employee')
      };

      // Display managers first
      if (groupedEmployees.manager.length > 0) {
        output += `#### 管理者 (${groupedEmployees.manager.length}人)\n`;
        groupedEmployees.manager.forEach((emp, index) => {
          output += `${index + 1}. **${emp.cn}** (${emp.title})\n`;
          output += `   - メール: ${emp.email}\n`;
          output += `   - 社員番号: ${emp.employeeNumber}\n`;
          output += `   - 雇用形態: ${emp.employeeType}\n`;
          if (emp.telephoneNumber) {
            output += `   - 内線: ${emp.telephoneNumber}\n`;
          }
          output += '\n';
        });
      }

      // Display regular employees
      if (groupedEmployees.employee.length > 0) {
        output += `#### 社員 (${groupedEmployees.employee.length}人)\n`;
        groupedEmployees.employee.forEach((emp, index) => {
          output += `${index + 1}. **${emp.cn}** (${emp.title})\n`;
          output += `   - メール: ${emp.email}\n`;
          output += `   - 社員番号: ${emp.employeeNumber}\n`;
          output += `   - 雇用形態: ${emp.employeeType}\n`;
          if (emp.telephoneNumber) {
            output += `   - 内線: ${emp.telephoneNumber}\n`;
          }
          if (emp.hireDate) {
            output += `   - 入社日: ${emp.hireDate}\n`;
          }
          output += '\n';
        });
      }

      // Display admins if any
      if (groupedEmployees.admin.length > 0) {
        output += `#### システム管理者 (${groupedEmployees.admin.length}人)\n`;
        groupedEmployees.admin.forEach((emp, index) => {
          output += `${index + 1}. **${emp.cn}** (${emp.title})\n`;
          output += `   - メール: ${emp.email}\n`;
          output += `   - 社員番号: ${emp.employeeNumber}\n`;
          output += `   - 雇用形態: ${emp.employeeType}\n`;
          output += '\n';
        });
      }
    } else {
      output += `### 👥 所属社員\n所属社員が見つかりませんでした。\n\n`;
    }

    // Helpful next actions
    output += `### 💡 関連操作\n`;
    output += `- 特定社員の詳細: \`get_employee_details\` で社員IDを指定\n`;
    output += `- 同じ部門の他部署: \`search_employees\` で division="${department.division}"\n`;
    output += `- 全組織構造: \`get_organization_structure\`\n`;
    if (department.manager) {
      output += `- 管理者の詳細: \`get_employee_details\` で employee_id="${department.manager.email}"\n`;
    }

    return output;

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return `❌ エラー: 部署が見つかりませんでした: ${input.department_name}\n\n💡 **ヒント**: 正確な部署名を指定してください。利用可能な部署は以下のツールで確認できます:\n- \`get_organization_structure\` - 全部署一覧\n- \`search_employees\` - 社員検索（部署でフィルタリング可能）`;
      }
      return `❌ エラー: 部署情報取得中にエラーが発生しました - ${error.message}`;
    }
    return '❌ エラー: 予期しないエラーが発生しました';
  }
}