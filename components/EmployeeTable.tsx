import React from 'react';
import { Employee } from '@/types/employee';

interface EmployeeTableProps {
  users: Employee[];
  loading: boolean;
  onDelete: (email: string) => Promise<boolean>;
  onRefresh: () => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({ 
  users, 
  loading, 
  onDelete, 
  onRefresh 
}) => {
  const getEmployeeTypeStyle = (employeeType?: string) => {
    switch (employeeType) {
      case '正社員':
        return 'bg-green-100 text-green-800';
      case '契約社員':
        return 'bg-yellow-100 text-yellow-800';
      case '役員':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'システム管理者';
      case 'manager':
        return '管理者';
      case 'employee':
        return '一般社員';
      default:
        return role;
    }
  };

  return (
    <div className="xl:col-span-3">
      <div className="bg-white rounded-lg border">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">👥 Employee Directory</h3>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50 text-sm"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-xs">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-2 text-left font-medium">社員番号</th>
                  <th className="px-3 py-2 text-left font-medium">氏名</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">部署</th>
                  <th className="px-3 py-2 text-left font-medium">役職</th>
                  <th className="px-3 py-2 text-left font-medium">雇用形態</th>
                  <th className="px-3 py-2 text-left font-medium">連絡先</th>
                  <th className="px-3 py-2 text-left font-medium">権限</th>
                  <th className="px-3 py-2 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.email} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono">
                      {user.attributes.employeeNumber || '-'}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {user.attributes.cn}
                      {user.attributes.title && (
                        <div className="text-gray-500">{user.attributes.title}</div>
                      )}
                    </td>
                    <td className="px-3 py-2">{user.email}</td>
                    <td className="px-3 py-2">
                      {user.attributes.department || '-'}
                      {user.attributes.division && (
                        <div className="text-gray-500">{user.attributes.division}</div>
                      )}
                    </td>
                    <td className="px-3 py-2">{user.attributes.title || '-'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${getEmployeeTypeStyle(user.attributes.employeeType)}`}>
                        {user.attributes.employeeType || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {user.attributes.telephoneNumber && (
                        <div>内線: {user.attributes.telephoneNumber}</div>
                      )}
                      {user.attributes.mobile && (
                        <div>携帯: {user.attributes.mobile}</div>
                      )}
                      {!user.attributes.telephoneNumber && !user.attributes.mobile && '-'}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${getRoleStyle(user.attributes.role)}`}>
                        {getRoleDisplayName(user.attributes.role)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => onDelete(user.email)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};