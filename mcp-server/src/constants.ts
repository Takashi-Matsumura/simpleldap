/**
 * Constants and configuration values
 */

export const LIMITS = {
  MAX_SEARCH_RESULTS: 100,
  DEFAULT_SEARCH_RESULTS: 10,
  MIN_SEARCH_RESULTS: 1,
  API_TIMEOUT: 10000,
  MAX_API_TIMEOUT: 60000,
  DEFAULT_PORT: 3000
} as const;

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee'
} as const;

export const EMPLOYEE_TYPES = {
  FULL_TIME: '正社員',
  CONTRACT: '契約社員',
  PART_TIME: 'パート',
  INTERN: 'インターン'
} as const;

export const ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED',
  TIMEOUT: 'TIMEOUT',
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  SERVER_ERROR: 'SERVER_ERROR'
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

export const TOOL_NAMES = {
  SEARCH_EMPLOYEES: 'search_employees',
  GET_EMPLOYEE_DETAILS: 'get_employee_details',
  GET_ORGANIZATION_STRUCTURE: 'get_organization_structure',
  GET_DEPARTMENT_INFO: 'get_department_info',
  VERIFY_EMPLOYEE_AUTH: 'verify_employee_auth',
  GET_COMPANY_STATISTICS: 'get_company_statistics'
} as const;

export const MESSAGES = {
  ERRORS: {
    NOT_FOUND: '指定された情報が見つかりませんでした',
    UNAUTHORIZED: '認証に失敗しました',
    RATE_LIMITED: 'レート制限に達しました',
    TIMEOUT: 'リクエストがタイムアウトしました',
    CONNECTION_REFUSED: 'サーバーに接続できません',
    UNEXPECTED: '予期しないエラーが発生しました'
  },
  HINTS: {
    CHECK_CONNECTION: 'ネットワーク接続を確認してください',
    CHECK_SERVER: 'SimpleLDAPサーバーが起動しているか確認してください',
    CHECK_API_KEY: 'APIキーが正しいか確認してください',
    CHECK_INPUT: '入力情報が正しいか確認してください',
    WAIT_AND_RETRY: 'しばらく待ってから再度お試しください'
  }
} as const;