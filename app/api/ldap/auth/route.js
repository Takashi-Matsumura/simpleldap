import { createApiResponse, createErrorResponse, validateRequired, validateEmail, ApiError } from '../../../../lib/api-utils';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const UserManager = require('../../../../lib/user-manager');

const userManager = new UserManager();

// POST: ユーザー認証テスト
export async function POST(request) {
  try {
    const data = await request.json();
    
    // 入力値検証
    validateRequired(data, ['email', 'password']);
    validateEmail(data.email);
    
    const { email, password } = data;
    const result = await userManager.authenticateUser(email, password);
    
    if (result.success) {
      return createApiResponse(true, {
        message: result.message,
        user: result.user
      });
    } else {
      throw new ApiError(result.message, 401);
    }
  } catch (error) {
    return createErrorResponse(error);
  }
}