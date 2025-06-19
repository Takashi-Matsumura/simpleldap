// Employee Details MCP Tool

import { z } from 'zod';
import { SimpleLDAPClient } from '../api-client.js';

export const employeeDetailsSchema = z.object({
  employee_id: z.string().describe('社員IDまたはメールアドレス（例: EMP001 または tanaka.sales@company.com）')
});

export type EmployeeDetailsInput = z.infer<typeof employeeDetailsSchema>;

export async function getEmployeeDetails(
  client: SimpleLDAPClient,
  input: EmployeeDetailsInput
): Promise<string> {
  try {
    const result = await client.getEmployeeDetails(input.employee_id);
    const employee = result.employee;

    let output = `## 社員詳細情報\n\n`;
    
    // Basic Information
    output += `### 基本情報\n`;
    output += `- **氏名**: ${employee.cn}\n`;
    if (employee.givenName && employee.sn) {
      output += `- **姓名**: ${employee.sn} ${employee.givenName}\n`;
    }
    output += `- **メール**: ${employee.email}\n`;
    output += `- **社員番号**: ${employee.employeeNumber}\n`;
    output += `- **システム権限**: ${employee.role}\n\n`;

    // Work Information
    output += `### 勤務情報\n`;
    output += `- **部署**: ${employee.department}\n`;
    output += `- **部門**: ${employee.division}\n`;
    output += `- **役職**: ${employee.title}\n`;
    output += `- **雇用形態**: ${employee.employeeType}\n`;
    if (employee.jobCode) {
      output += `- **職種コード**: ${employee.jobCode}\n`;
    }
    if (employee.hireDate) {
      output += `- **入社日**: ${employee.hireDate}\n`;
    }
    output += '\n';

    // Contact Information
    output += `### 連絡先\n`;
    if (employee.telephoneNumber) {
      output += `- **内線**: ${employee.telephoneNumber}\n`;
    }
    if (employee.mobile) {
      output += `- **携帯**: ${employee.mobile}\n`;
    }
    if (employee.physicalDeliveryOfficeName) {
      output += `- **勤務地**: ${employee.physicalDeliveryOfficeName}\n`;
    }
    output += '\n';

    // Management Information
    if (employee.manager || employee.subordinatesCount !== undefined) {
      output += `### 組織情報\n`;
      
      if (employee.manager) {
        output += `- **直属の上司**: ${employee.manager.name} (${employee.manager.email})\n`;
      }
      
      if (employee.subordinatesCount !== undefined) {
        output += `- **部下の人数**: ${employee.subordinatesCount}人\n`;
      }

      if (employee.subordinates && employee.subordinates.length > 0) {
        output += `- **直属の部下**:\n`;
        employee.subordinates.forEach(subordinate => {
          output += `  - ${subordinate.name} (${subordinate.title}) - ${subordinate.email}\n`;
        });
      }
      output += '\n';
    }

    // Additional helpful information
    output += `### 💡 関連操作\n`;
    output += `- 同じ部署の他の社員: \`search_employees\` で department="${employee.department}"\n`;
    output += `- 部署の詳細情報: \`get_department_info\` で department_name="${employee.department}"\n`;
    if (employee.manager) {
      output += `- 上司の詳細: \`get_employee_details\` で employee_id="${employee.manager.email}"\n`;
    }

    return output;

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return `❌ エラー: 社員が見つかりませんでした: ${input.employee_id}\n\n💡 **ヒント**: 正確な社員番号（例: EMP001）またはメールアドレスを指定してください。社員の検索には \`search_employees\` ツールを使用できます。`;
      }
      return `❌ エラー: 社員詳細取得中にエラーが発生しました - ${error.message}`;
    }
    return '❌ エラー: 予期しないエラーが発生しました';
  }
}