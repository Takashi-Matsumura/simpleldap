// Authentication Verification MCP Tool

import { z } from 'zod';
import { SimpleLDAPClient } from '../api-client.js';

export const authVerifySchema = z.object({
  email: z.string().email().describe('メールアドレス'),
  password: z.string().describe('パスワード（注意: 実際のパスワードは慎重に扱ってください）')
});

export type AuthVerifyInput = z.infer<typeof authVerifySchema>;

export async function verifyEmployeeAuth(
  client: SimpleLDAPClient,
  input: AuthVerifyInput
): Promise<string> {
  try {
    const result = await client.verifyEmployeeAuth(input.email, input.password);

    let output = `## 認証確認結果\n\n`;

    if (result.authenticated && result.employee) {
      output += `### ✅ 認証成功\n\n`;
      output += `**認証されたユーザー情報:**\n`;
      output += `- **氏名**: ${result.employee.cn}\n`;
      output += `- **メール**: ${result.employee.email}\n`;
      output += `- **社員番号**: ${result.employee.employeeNumber}\n`;
      output += `- **部署**: ${result.employee.department}\n`;
      output += `- **役職**: ${result.employee.title}\n`;
      output += `- **システム権限**: ${result.employee.role}\n`;
      output += `- **雇用形態**: ${result.employee.employeeType}\n\n`;

      // Security note
      output += `### 🔒 セキュリティ情報\n`;
      output += `- 認証は正常に完了しました\n`;
      output += `- ユーザーは有効なアカウントを持っています\n`;
      
      if (result.employee.role === 'admin') {
        output += `- ⚠️ **注意**: このユーザーはシステム管理者権限を持っています\n`;
      } else if (result.employee.role === 'manager') {
        output += `- このユーザーは管理者権限を持っています\n`;
      }

      // Next actions
      output += `\n### 💡 関連操作\n`;
      output += `- ユーザーの詳細情報: \`get_employee_details\` で employee_id="${result.employee.employeeNumber}"\n`;
      output += `- 同じ部署の情報: \`get_department_info\` で department_name="${result.employee.department}"\n`;

    } else {
      output += `### ❌ 認証失敗\n\n`;
      output += `指定されたメールアドレスとパスワードの組み合わせが正しくありません。\n\n`;
      
      output += `**確認事項:**\n`;
      output += `- メールアドレスが正確か確認してください\n`;
      output += `- パスワードが正確か確認してください\n`;
      output += `- アカウントが有効か確認してください\n\n`;

      output += `### 💡 トラブルシューティング\n`;
      output += `- 社員の存在確認: \`search_employees\` で query="${input.email.split('@')[0]}"\n`;
      output += `- 組織内の確認: \`get_organization_structure\`\n`;
    }

    // Security warning
    output += `\n### ⚠️ セキュリティ注意事項\n`;
    output += `- このツールは認証テスト目的で使用してください\n`;
    output += `- パスワード情報は適切に管理してください\n`;
    output += `- 本番環境での使用時は十分注意してください\n`;

    return output;

  } catch (error) {
    if (error instanceof Error) {
      return `❌ エラー: 認証確認中にエラーが発生しました - ${error.message}\n\n💡 **ヒント**: ネットワーク接続やAPIサーバーの状態を確認してください。`;
    }
    return '❌ エラー: 予期しないエラーが発生しました';
  }
}