// Company Statistics MCP Tool

import { z } from 'zod';
import { SimpleLDAPClient } from '../api-client.js';

export const companyStatisticsSchema = z.object({
  include_departments: z.boolean().default(true).describe('部署別の詳細統計を含めるか')
});

export type CompanyStatisticsInput = z.infer<typeof companyStatisticsSchema>;

export async function getCompanyStatistics(
  client: SimpleLDAPClient,
  input: CompanyStatisticsInput
): Promise<string> {
  try {
    // Get organization structure and departments list
    const [orgResult, deptResult] = await Promise.all([
      client.getOrganizationStructure(),
      client.getDepartmentsList()
    ]);

    let output = `## 会社統計情報\n\n`;

    // Overall company statistics
    output += `### 📊 全社統計\n`;
    output += `- **総従業員数**: ${orgResult.totalEmployees}人\n`;
    output += `- **部門数**: ${orgResult.totalDivisions}\n`;
    output += `- **部署数**: ${orgResult.totalDepartments}\n`;

    // Calculate role distribution from organization data
    const roleDistribution = calculateRoleDistribution(orgResult);
    output += `- **管理階層数**: ${orgResult.managementHierarchy.length}人\n\n`;

    // Department statistics
    if (input.include_departments && deptResult.departments) {
      output += `### 🏢 部署別統計\n\n`;
      
      // Sort departments by employee count (descending)
      const sortedDepartments = [...deptResult.departments].sort(
        (a, b) => (b.statistics?.totalEmployees || 0) - (a.statistics?.totalEmployees || 0)
      );

      sortedDepartments.forEach((dept, index) => {
        if (dept.statistics) {
          output += `#### ${index + 1}. ${dept.name}\n`;
          output += `- **従業員数**: ${dept.statistics.totalEmployees}人\n`;
          output += `- **管理者数**: ${dept.statistics.managers}人\n`;
          output += `- **平均勤続年数**: ${dept.statistics.averageYearsOfService}年\n`;
          if (dept.division) {
            output += `- **所属部門**: ${dept.division}\n`;
          }
          output += '\n';
        }
      });
    }

    // Division statistics
    if (orgResult.divisions.length > 0) {
      output += `### 🏛️ 部門別統計\n\n`;
      
      // Sort divisions by employee count
      const sortedDivisions = [...orgResult.divisions].sort(
        (a, b) => b.employeeCount - a.employeeCount
      );

      sortedDivisions.forEach((division, index) => {
        output += `#### ${index + 1}. ${division.name}\n`;
        output += `- **従業員数**: ${division.employeeCount}人 (全体の${Math.round(division.employeeCount / orgResult.totalEmployees * 100)}%)\n`;
        output += `- **部署数**: ${division.departments.length}\n`;
        
        if (division.departments.length > 0) {
          output += `- **所属部署**: ${division.departments.map(d => d.name).join(', ')}\n`;
        }
        output += '\n';
      });
    }

    // Management hierarchy statistics
    if (orgResult.managementHierarchy.length > 0) {
      output += `### 👑 管理階層統計\n\n`;
      
      const hierarchyStats = calculateHierarchyStats(orgResult.managementHierarchy);
      output += `- **トップレベル管理者**: ${orgResult.managementHierarchy.length}人\n`;
      output += `- **最大管理スパン**: ${hierarchyStats.maxSpan}人\n`;
      output += `- **平均管理スパン**: ${hierarchyStats.averageSpan}人\n`;
      output += `- **最大階層深度**: ${hierarchyStats.maxDepth}レベル\n\n`;

      // Top managers by subordinate count
      const topManagers = orgResult.managementHierarchy
        .sort((a, b) => b.subordinatesCount - a.subordinatesCount)
        .slice(0, 5);

      if (topManagers.length > 0) {
        output += `**管理スパンが大きいマネージャー（上位5名）:**\n`;
        topManagers.forEach((manager, index) => {
          output += `${index + 1}. ${manager.name} (${manager.title}) - ${manager.subordinatesCount}人の部下\n`;
        });
        output += '\n';
      }
    }

    // Quick insights
    output += `### 💡 インサイト\n`;
    
    if (orgResult.totalEmployees > 0) {
      const avgEmployeesPerDept = Math.round(orgResult.totalEmployees / orgResult.totalDepartments);
      output += `- 部署あたりの平均従業員数: ${avgEmployeesPerDept}人\n`;
    }
    
    if (orgResult.divisions.length > 0) {
      const largestDivision = orgResult.divisions.reduce((prev, current) => 
        prev.employeeCount > current.employeeCount ? prev : current
      );
      output += `- 最大部門: ${largestDivision.name} (${largestDivision.employeeCount}人)\n`;
    }

    output += `\n### 🔍 詳細情報の取得\n`;
    output += `- 特定部署の詳細: \`get_department_info\` で部署名を指定\n`;
    output += `- 組織構造の詳細: \`get_organization_structure\`\n`;
    output += `- 社員検索: \`search_employees\` で条件を指定\n`;

    return output;

  } catch (error) {
    if (error instanceof Error) {
      return `❌ エラー: 統計情報取得中にエラーが発生しました - ${error.message}`;
    }
    return '❌ エラー: 予期しないエラーが発生しました';
  }
}

function calculateRoleDistribution(orgData: any): { admin: number; manager: number; employee: number } {
  // This would require additional API calls to get detailed role information
  // For now, we'll return a placeholder
  return {
    admin: 0,
    manager: orgData.managementHierarchy.length,
    employee: orgData.totalEmployees - orgData.managementHierarchy.length
  };
}

function calculateHierarchyStats(hierarchy: any[]): {
  maxSpan: number;
  averageSpan: number;
  maxDepth: number;
} {
  let maxSpan = 0;
  let totalSpan = 0;
  let managerCount = 0;
  let maxDepth = 0;

  function traverse(node: any, depth: number = 1) {
    if (node.subordinatesCount > maxSpan) {
      maxSpan = node.subordinatesCount;
    }
    
    if (node.subordinatesCount > 0) {
      totalSpan += node.subordinatesCount;
      managerCount++;
    }

    if (depth > maxDepth) {
      maxDepth = depth;
    }

    if (node.subordinates) {
      node.subordinates.forEach((subordinate: any) => {
        traverse(subordinate, depth + 1);
      });
    }
  }

  hierarchy.forEach(topManager => traverse(topManager));

  return {
    maxSpan,
    averageSpan: managerCount > 0 ? Math.round(totalSpan / managerCount) : 0,
    maxDepth
  };
}