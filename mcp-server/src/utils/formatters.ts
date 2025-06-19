/**
 * Formatting utilities for consistent output
 */

import { Employee } from '../types.js';
import { DivisionInfo, DepartmentWithStats } from '../types/extended.js';
import { ROLES, EMPLOYEE_TYPES } from '../constants.js';

export class MarkdownFormatter {
  static section(title: string, level: number = 2): string {
    return `${'#'.repeat(level)} ${title}\n\n`;
  }
  
  static keyValue(key: string, value: string | number | undefined): string {
    if (value === undefined || value === null) return '';
    return `- **${key}**: ${value}\n`;
  }
  
  static list(items: string[]): string {
    return items.map(item => `- ${item}`).join('\n') + '\n';
  }
  
  static numberedList(items: string[]): string {
    return items.map((item, index) => `${index + 1}. ${item}`).join('\n') + '\n';
  }
  
  static code(content: string, language: string = ''): string {
    return `\`\`\`${language}\n${content}\n\`\`\`\n`;
  }
  
  static inlineCode(content: string): string {
    return `\`${content}\``;
  }
  
  static bold(text: string): string {
    return `**${text}**`;
  }
  
  static italic(text: string): string {
    return `*${text}*`;
  }
  
  static link(text: string, url: string): string {
    return `[${text}](${url})`;
  }
  
  static employeeInfo(employee: Employee): string {
    let output = '';
    output += this.keyValue('氏名', employee.cn);
    output += this.keyValue('メール', employee.email);
    output += this.keyValue('社員番号', employee.employeeNumber);
    output += this.keyValue('部署', employee.department);
    output += this.keyValue('役職', employee.title);
    output += this.keyValue('システム権限', this.formatRole(employee.role));
    output += this.keyValue('雇用形態', employee.employeeType);
    if (employee.telephoneNumber) {
      output += this.keyValue('電話番号', employee.telephoneNumber);
    }
    return output;
  }
  
  static employeeSummary(employee: Employee): string {
    return `${employee.cn} (${employee.employeeNumber}) - ${employee.department} ${employee.title}`;
  }
  
  static departmentInfo(department: DepartmentWithStats): string {
    let output = '';
    output += this.keyValue('部署名', department.name);
    if (department.statistics) {
      output += this.keyValue('従業員数', `${department.statistics.totalEmployees}人`);
      output += this.keyValue('管理者数', `${department.statistics.managers}人`);
      output += this.keyValue('平均勤続年数', `${department.statistics.averageYearsOfService}年`);
    }
    if (department.division) {
      output += this.keyValue('所属部門', department.division);
    }
    return output;
  }
  
  static divisionInfo(division: DivisionInfo): string {
    let output = '';
    output += this.keyValue('部門名', division.name);
    output += this.keyValue('従業員数', `${division.employeeCount}人`);
    output += this.keyValue('部署数', division.departments.length);
    if (division.departments.length > 0) {
      const deptNames = division.departments.map(d => d.name).join(', ');
      output += this.keyValue('所属部署', deptNames);
    }
    return output;
  }
  
  static formatRole(role: string): string {
    const roleMap: Record<string, string> = {
      [ROLES.ADMIN]: '管理者',
      [ROLES.MANAGER]: 'マネージャー',
      [ROLES.EMPLOYEE]: '一般社員'
    };
    return roleMap[role] || role;
  }
  
  static formatPercentage(value: number, total: number): string {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  }
  
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  static table(headers: string[], rows: string[][]): string {
    let output = '| ' + headers.join(' | ') + ' |\n';
    output += '|' + headers.map(() => '---').join('|') + '|\n';
    rows.forEach(row => {
      output += '| ' + row.join(' | ') + ' |\n';
    });
    return output + '\n';
  }
}

export class RelatedOperations {
  static forEmployee(employee: Employee): string[] {
    return [
      `同じ部署の他の社員: ${MarkdownFormatter.inlineCode('search_employees')} で department="${employee.department}"`,
      `部署の詳細情報: ${MarkdownFormatter.inlineCode('get_department_info')} で department_name="${employee.department}"`,
      `上司の情報: ${MarkdownFormatter.inlineCode('get_employee_details')} で employee_id="${employee.manager || 'マネージャーID'}"`,
      `組織全体の構造: ${MarkdownFormatter.inlineCode('get_organization_structure')}`
    ];
  }
  
  static forDepartment(departmentName: string): string[] {
    return [
      `部署の社員一覧: ${MarkdownFormatter.inlineCode('search_employees')} で department="${departmentName}"`,
      `管理者の検索: ${MarkdownFormatter.inlineCode('search_employees')} で department="${departmentName}" role="manager"`,
      `組織構造の確認: ${MarkdownFormatter.inlineCode('get_organization_structure')}`
    ];
  }
  
  static forOrganization(): string[] {
    return [
      `特定部署の詳細: ${MarkdownFormatter.inlineCode('get_department_info')} で部署名を指定`,
      `社員検索: ${MarkdownFormatter.inlineCode('search_employees')} で条件を指定`,
      `会社統計: ${MarkdownFormatter.inlineCode('get_company_statistics')}`
    ];
  }
  
  static forError(context: string): string[] {
    const suggestions = [
      `社員の存在確認: ${MarkdownFormatter.inlineCode('search_employees')}`,
      `組織構造の確認: ${MarkdownFormatter.inlineCode('get_organization_structure')}`,
      `部署一覧の確認: ${MarkdownFormatter.inlineCode('get_company_statistics')}`
    ];
    
    if (context.includes('社員') || context.includes('employee')) {
      suggestions.unshift(`名前で検索: ${MarkdownFormatter.inlineCode('search_employees')} で query="名前の一部"`);
    }
    
    return suggestions;
  }
}