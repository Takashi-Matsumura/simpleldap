import { createApiResponse, createErrorResponse, validateRequired, validateEmail, validatePassword, validateEmployeeNumber, ApiError } from '../../../../lib/api-utils';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const UserManager = require('../../../../lib/user-manager');

const userManager = new UserManager();

// GET: 全ユーザーの取得
export async function GET() {
  try {
    const users = userManager.getAllUsers();
    const stats = userManager.getStats();

    return createApiResponse(true, {
      users: Object.keys(users).map(email => ({
        email,
        dn: users[email].dn,
        attributes: users[email].attributes
      })),
      stats
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

// POST: 新しいユーザーの追加
export async function POST(request) {
  try {
    const data = await request.json();
    
    // 入力値検証
    validateRequired(data, ['email', 'password']);
    validateEmail(data.email);
    validatePassword(data.password);
    
    const { email, password, attributes } = data;
    
    // 属性の検証
    if (attributes) {
      if (attributes.employeeNumber) {
        validateEmployeeNumber(attributes.employeeNumber);
      }
      if (attributes.role && !['admin', 'manager', 'employee'].includes(attributes.role)) {
        throw new ApiError('Invalid role. Must be admin, manager, or employee', 400);
      }
      if (attributes.employeeType && !['正社員', '契約社員', '役員'].includes(attributes.employeeType)) {
        throw new ApiError('Invalid employee type', 400);
      }
    }

    const user = await userManager.addUser(email, password, attributes);

    return createApiResponse(true, {
      message: 'User created successfully',
      user: {
        email,
        dn: user.dn,
        attributes: user.attributes
      }
    }, null, 201);
  } catch (error) {
    return createErrorResponse(error);
  }
}