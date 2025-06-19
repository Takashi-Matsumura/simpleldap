import React, { useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { OrganizationEmployee } from '@/types/employee';

export const OrganizationTab: React.FC = () => {
  const { 
    organizationData, 
    departmentStats, 
    loading, 
    error, 
    fetchAllOrganizationData 
  } = useOrganization();

  useEffect(() => {
    fetchAllOrganizationData();
  }, [fetchAllOrganizationData]);

  // 管理階層ツリーをレンダリングする関数
  const renderManagerTree = (manager: OrganizationEmployee, level: number): React.ReactElement => {
    const indent = level * 20;
    return (
      <div key={manager.email} style={{ marginLeft: `${indent}px` }} className="mb-2">
        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded border-l-4 border-blue-400">
          <div className="flex-1">
            <div className="font-medium text-gray-900">{manager.name}</div>
            <div className="text-sm text-gray-600">{manager.title}</div>
            <div className="text-xs text-gray-500">{manager.department}</div>
          </div>
          <div className="text-right">
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {manager.subordinates.length}名の部下
            </div>
          </div>
        </div>
        {manager.subordinates && manager.subordinates.length > 0 && (
          <div className="mt-1">
            {manager.subordinates.map(subordinate => 
              renderManagerTree(subordinate, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Organization</h2>
          <p className="text-gray-600">View departments, divisions, and organizational structure</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">エラー</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Organization</h2>
        <p className="text-gray-600">View departments, divisions, and organizational structure</p>
      </div>
      
      {/* 組織統計 */}
      {organizationData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-semibold text-blue-600">Total Employees</h3>
            <p className="text-2xl font-bold text-blue-800">{organizationData.statistics.totalEmployees}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-semibold text-green-600">Divisions</h3>
            <p className="text-2xl font-bold text-green-800">{organizationData.statistics.totalDivisions}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-semibold text-purple-600">Departments</h3>
            <p className="text-2xl font-bold text-purple-800">{organizationData.statistics.totalDepartments}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-semibold text-orange-600">Managers</h3>
            <p className="text-2xl font-bold text-orange-800">{organizationData.statistics.totalManagers}</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 組織構造 */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">🏢 Organization Structure</h3>
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto">
            {organizationData ? (
              <div className="space-y-4">
                {Object.entries(organizationData.organization).map(([divisionName, division]) => (
                  <div key={divisionName} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-gray-800">{divisionName}</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {division.totalEmployees}名
                      </span>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(division.departments).map(([deptName, dept]) => (
                        <div key={deptName} className="ml-4 p-2 bg-gray-50 rounded border-l-2 border-gray-300">
                          <div className="flex justify-between items-center">
                            <h5 className="font-medium text-gray-700">{deptName}</h5>
                            <div className="flex gap-2 text-xs">
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                管理者: {dept.managers.length}
                              </span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                部下: {dept.subordinates.length}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            総数: {dept.employees.length}名
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {loading ? 'Loading organization data...' : 'No organization data available'}
              </div>
            )}
          </div>
        </div>
        
        {/* 管理階層 */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">👑 Management Hierarchy</h3>
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto">
            {organizationData && organizationData.managementTree ? (
              <div className="space-y-3">
                {organizationData.managementTree.map((manager, index) => (
                  <div key={index}>
                    {renderManagerTree(manager, 0)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {loading ? 'Loading management hierarchy...' : 'No management hierarchy available'}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 部署別統計 */}
      {departmentStats && departmentStats.departmentStats && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">📊 Department Statistics</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(departmentStats.departmentStats).map(([deptName, stats]) => (
                <div key={deptName} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">{deptName}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>総員数:</span>
                      <span className="font-medium">{stats.totalEmployees}名</span>
                    </div>
                    <div className="flex justify-between">
                      <span>管理者:</span>
                      <span className="font-medium">{stats.managers}名</span>
                    </div>
                    <div className="flex justify-between">
                      <span>一般社員:</span>
                      <span className="font-medium">{stats.employees}名</span>
                    </div>
                    <div className="flex justify-between">
                      <span>平均勤続:</span>
                      <span className="font-medium">{stats.averageYears}年</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};