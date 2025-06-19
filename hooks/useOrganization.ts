import { useState, useCallback } from 'react';
import { OrganizationData, DepartmentStatsResponse } from '@/types/employee';

export const useOrganization = () => {
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 組織データの取得
  const fetchOrganizationData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ldap/organization');
      const data = await response.json();
      if (data.success) {
        setOrganizationData(data);
      } else {
        setError(data.message || 'Failed to fetch organization data');
      }
    } catch (error) {
      console.error('Error fetching organization data:', error);
      setError('Failed to fetch organization data');
    } finally {
      setLoading(false);
    }
  }, []);

  // 部署統計の取得
  const fetchDepartmentStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ldap/departments');
      const data = await response.json();
      if (data.success) {
        setDepartmentStats(data);
      } else {
        setError(data.message || 'Failed to fetch department stats');
      }
    } catch (error) {
      console.error('Error fetching department stats:', error);
      setError('Failed to fetch department stats');
    } finally {
      setLoading(false);
    }
  }, []);

  // 組織データの一括取得
  const fetchAllOrganizationData = useCallback(async () => {
    await Promise.all([
      fetchOrganizationData(),
      fetchDepartmentStats()
    ]);
  }, [fetchOrganizationData, fetchDepartmentStats]);

  return {
    organizationData,
    departmentStats,
    loading,
    error,
    fetchOrganizationData,
    fetchDepartmentStats,
    fetchAllOrganizationData
  };
};