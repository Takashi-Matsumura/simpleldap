// Organization Structure MCP Tool

import { z } from 'zod';
import { SimpleLDAPClient } from '../api-client.js';
import { ManagementNode } from '../types.js';

export const organizationStructureSchema = z.object({
  include_hierarchy: z.boolean().default(true).describe('管理階層ツリーを含めるか（true: 含める, false: 部門情報のみ）')
});

export type OrganizationStructureInput = z.infer<typeof organizationStructureSchema>;

export async function getOrganizationStructure(
  client: SimpleLDAPClient,
  input: OrganizationStructureInput
): Promise<string> {
  try {
    const result = await client.getOrganizationStructure();

    let output = `## 組織構造\n\n`;

    // Overall statistics
    output += `### 📊 全社統計\n`;
    output += `- **総従業員数**: ${result.totalEmployees}人\n`;
    output += `- **部門数**: ${result.totalDivisions}\n`;
    output += `- **部署数**: ${result.totalDepartments}\n\n`;

    // Divisions and Departments
    output += `### 🏢 部門・部署構造\n\n`;
    
    result.divisions.forEach((division, divIndex) => {
      output += `#### ${divIndex + 1}. ${division.name} (${division.employeeCount}人)\n`;
      
      if (division.departments.length > 0) {
        division.departments.forEach((department, deptIndex) => {
          output += `   ${String.fromCharCode(97 + deptIndex)}. **${department.name}** - ${department.employeeCount}人`;
          
          if (department.manager) {
            output += ` (管理者: ${department.manager.name})`;
          }
          output += '\n';
        });
      } else {
        output += '   （部署情報なし）\n';
      }
      output += '\n';
    });

    // Management Hierarchy
    if (input.include_hierarchy && result.managementHierarchy.length > 0) {
      output += `### 👑 管理階層ツリー\n\n`;
      
      result.managementHierarchy.forEach((topManager, index) => {
        output += `#### ${index + 1}. ${topManager.name} (${topManager.title})\n`;
        output += formatManagementTree(topManager, 1);
        output += '\n';
      });
    }

    // Helpful next actions
    output += `### 💡 詳細情報の取得\n`;
    output += `- 特定部署の詳細: \`get_department_info\` で部署名を指定\n`;
    output += `- 社員検索: \`search_employees\` で部署や部門でフィルタリング\n`;
    output += `- 特定社員の詳細: \`get_employee_details\` で社員IDを指定\n`;

    return output;

  } catch (error) {
    if (error instanceof Error) {
      return `❌ エラー: 組織構造取得中にエラーが発生しました - ${error.message}`;
    }
    return '❌ エラー: 予期しないエラーが発生しました';
  }
}

function formatManagementTree(node: ManagementNode, depth: number): string {
  let output = '';
  const indent = '  '.repeat(depth);
  
  if (node.subordinates && node.subordinates.length > 0) {
    node.subordinates.forEach((subordinate, index) => {
      const isLast = index === node.subordinates.length - 1;
      const prefix = isLast ? '└─' : '├─';
      
      output += `${indent}${prefix} ${subordinate.name} (${subordinate.title})`;
      if (subordinate.subordinatesCount > 0) {
        output += ` [${subordinate.subordinatesCount}人の部下]`;
      }
      output += '\n';
      
      // Recursively format subordinates
      if (subordinate.subordinates && subordinate.subordinates.length > 0) {
        const nextIndent = isLast ? '  ' : '│ ';
        const subTree = formatManagementTree(subordinate, depth + 1);
        output += subTree.split('\n').map(line => 
          line ? `${indent}${nextIndent}${line.substring(indent.length)}` : line
        ).join('\n');
      }
    });
  }
  
  return output;
}