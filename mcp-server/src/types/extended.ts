/**
 * Extended type definitions for formatting
 */

import { Department } from '../types.js';

export interface DivisionInfo {
  name: string;
  employeeCount: number;
  departments: Department[];
}

export interface DepartmentWithStats extends Department {
  division?: string;
  statistics?: {
    totalEmployees: number;
    managers: number;
    averageYearsOfService: number;
  };
}