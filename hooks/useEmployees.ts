import { useState, useCallback } from 'react';
import { Employee, EmployeeStats, NewEmployeeForm } from '@/types/employee';

export const useEmployees = () => {
  const [users, setUsers] = useState<Employee[]>([]);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ユーザー一覧の取得
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ldap/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
        setStats(data.stats);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  // 新しいユーザーの追加
  const addUser = useCallback(async (newUser: NewEmployeeForm) => {
    if (!newUser.email || !newUser.password) {
      setError('Email and password are required');
      return false;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ldap/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          attributes: {
            cn: newUser.cn || newUser.email.split('@')[0],
            givenName: newUser.givenName,
            sn: newUser.sn,
            telephoneNumber: newUser.telephoneNumber,
            role: newUser.role,
            // 社員情報
            employeeNumber: newUser.employeeNumber,
            department: newUser.department,
            division: newUser.division,
            title: newUser.title,
            manager: newUser.manager,
            employeeType: newUser.employeeType,
            mobile: newUser.mobile,
            physicalDeliveryOfficeName: newUser.physicalDeliveryOfficeName,
            costCenter: newUser.costCenter,
            hireDate: newUser.hireDate,
            jobCode: newUser.jobCode
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        await fetchUsers(); // 一覧を再取得
        return true;
      } else {
        setError(data.message || 'Failed to add user');
        return false;
      }
    } catch (error) {
      console.error('Error adding user:', error);
      setError('Failed to add user');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  // ユーザーの削除
  const deleteUser = useCallback(async (email: string) => {
    if (!confirm(`Are you sure you want to delete user: ${email}?`)) {
      return false;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ldap/users/${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await fetchUsers(); // 一覧を再取得
        return true;
      } else {
        setError(data.message || 'Failed to delete user');
        return false;
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  return {
    users,
    stats,
    loading,
    error,
    fetchUsers,
    addUser,
    deleteUser
  };
};