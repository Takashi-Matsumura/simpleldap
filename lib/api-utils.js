// API共通エラーハンドリングとレスポンス形式の統一

export class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// 統一されたAPIレスポンス形式
export function createApiResponse(success, data = null, message = null, statusCode = 200) {
  const response = { success };
  
  if (data !== null) {
    if (success) {
      Object.assign(response, data);
    }
  }
  
  if (message) {
    response.message = message;
  }
  
  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

// エラーレスポンスの作成
export function createErrorResponse(error, statusCode = 500) {
  console.error('API Error:', error);
  
  const message = error instanceof ApiError 
    ? error.message 
    : 'Internal server error';
    
  const status = error instanceof ApiError 
    ? error.statusCode 
    : statusCode;
  
  return createApiResponse(false, null, message, status);
}

// 入力値の検証
export function validateRequired(data, requiredFields) {
  const missing = requiredFields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new ApiError(`Required fields missing: ${missing.join(', ')}`, 400);
  }
}

// メールアドレスの検証
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError('Invalid email format', 400);
  }
}

// パスワードの検証
export function validatePassword(password) {
  if (password.length < 6) {
    throw new ApiError('Password must be at least 6 characters', 400);
  }
}

// 社員番号の検証
export function validateEmployeeNumber(employeeNumber) {
  if (employeeNumber && !/^[A-Z0-9-]+$/.test(employeeNumber)) {
    throw new ApiError('Employee number must contain only uppercase letters, numbers, and hyphens', 400);
  }
}