// SimpleLDAP API Client for MCP Server

import fetch from 'node-fetch';
import {
  ApiResponse,
  EmployeeListResponse,
  EmployeeDetailResponse,
  OrganizationResponse,
  DepartmentDetailResponse,
  AuthVerifyResponse,
  SimpleLDAPClientConfig
} from './types.js';

export class SimpleLDAPClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: SimpleLDAPClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 10000;
  }

  private async makeRequest<T>(endpoint: string, options: {
    method?: 'GET' | 'POST';
    body?: any;
    params?: Record<string, string>;
  } = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', body, params } = options;
    
    // Build URL with query parameters
    const url = new URL(`${this.baseUrl}/api/v1/external${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const requestOptions: any = {
      method,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'SimpleLDAP-MCP-Server/1.0.0'
      },
      timeout: this.timeout
    };

    if (body && method === 'POST') {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url.toString(), requestOptions);
      const data = await response.json() as ApiResponse<T>;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error?.message || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`SimpleLDAP API Error: ${error.message}`);
      }
      throw new Error('SimpleLDAP API Error: Unknown error');
    }
  }

  /**
   * Search employees with optional filters
   */
  async searchEmployees(options: {
    query?: string;
    department?: string;
    division?: string;
    role?: string;
    limit?: number;
    page?: number;
  } = {}): Promise<EmployeeListResponse> {
    const params: Record<string, string> = {};
    
    if (options.query) params.search = options.query;
    if (options.department) params.department = options.department;
    if (options.division) params.division = options.division;
    if (options.role) params.role = options.role;
    if (options.limit) params.limit = options.limit.toString();
    if (options.page) params.page = options.page.toString();

    const response = await this.makeRequest<EmployeeListResponse>('/employees', {
      method: 'GET',
      params
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to search employees');
    }

    return response.data;
  }

  /**
   * Get employee details by ID or email
   */
  async getEmployeeDetails(employeeId: string): Promise<EmployeeDetailResponse> {
    const response = await this.makeRequest<EmployeeDetailResponse>(`/employees/${encodeURIComponent(employeeId)}`, {
      method: 'GET'
    });

    if (!response.success || !response.data) {
      throw new Error(`Employee not found: ${employeeId}`);
    }

    return response.data;
  }

  /**
   * Get organization structure
   */
  async getOrganizationStructure(): Promise<OrganizationResponse> {
    const response = await this.makeRequest<OrganizationResponse>('/organization', {
      method: 'GET'
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to get organization structure');
    }

    return response.data;
  }

  /**
   * Get department information
   */
  async getDepartmentInfo(departmentName: string): Promise<DepartmentDetailResponse> {
    const response = await this.makeRequest<DepartmentDetailResponse>(`/departments/${encodeURIComponent(departmentName)}`, {
      method: 'GET'
    });

    if (!response.success || !response.data) {
      throw new Error(`Department not found: ${departmentName}`);
    }

    return response.data;
  }

  /**
   * Verify employee authentication
   */
  async verifyEmployeeAuth(email: string, password: string): Promise<AuthVerifyResponse> {
    const response = await this.makeRequest<AuthVerifyResponse>('/auth/verify', {
      method: 'POST',
      body: { email, password }
    });

    if (!response.success || !response.data) {
      throw new Error('Authentication verification failed');
    }

    return response.data;
  }

  /**
   * Get all departments list
   */
  async getDepartmentsList(): Promise<{ departments: any[]; divisions: any[]; summary: any }> {
    const response = await this.makeRequest<{ departments: any[]; divisions: any[]; summary: any }>('/departments', {
      method: 'GET'
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to get departments list');
    }

    return response.data;
  }

  /**
   * Health check - test API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.searchEmployees({ limit: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }
}