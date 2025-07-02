'use client';

import { useState, useEffect } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { AuthTestTab } from '@/components/AuthTestTab';
import { EmployeeForm } from '@/components/EmployeeForm';
import { EmployeeTable } from '@/components/EmployeeTable';
import { OrganizationTab } from '@/components/OrganizationTab';
import { ExternalApiTestTab } from '@/components/ExternalApiTestTab';
import { ExternalLdapTestTab } from '@/components/ExternalLdapTestTab';
import { StatsCards } from '@/components/StatsCards';
import { TabNavigation, Tab } from '@/components/TabNavigation';

const tabs: Tab[] = [
  { id: 'auth', name: '🧪 Authentication Test', description: 'Test LDAP authentication' },
  { id: 'employees', name: '👥 Employee Management', description: 'Manage employees and view directory' },
  { id: 'organization', name: '🏢 Organization', description: 'View departments and organization chart' },
  { id: 'external-api', name: '🔌 External API Test', description: 'Test external APIs and analyze data structures' },
  { id: 'external-ldap', name: '🌐 External LDAP Test', description: 'Test authentication with external OpenLDAP server' }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('auth');
  const { users, stats, loading, error, fetchUsers, addUser, deleteUser } = useEmployees();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // エラー表示用のコンポーネント
  const ErrorAlert = ({ message }: { message: string }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p className="text-red-800">{message}</p>
    </div>
  );

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔐 SimpleLDAP - Employee Management System
        </h1>

        {/* 統計情報 */}
        <StatsCards stats={stats} />

        {/* エラー表示 */}
        {error && <ErrorAlert message={error} />}

        {/* タブナビゲーション */}
        <TabNavigation 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        {/* タブコンテンツ */}
        <div className="p-6">
          {/* Authentication Test Tab */}
          {activeTab === 'auth' && <AuthTestTab />}

          {/* Employee Management Tab */}
          {activeTab === 'employees' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Employee Management</h2>
                <p className="text-gray-600">Add new employees and manage the employee directory</p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <EmployeeForm loading={loading} onSubmit={addUser} />
                <EmployeeTable 
                  users={users} 
                  loading={loading} 
                  onDelete={deleteUser} 
                  onRefresh={fetchUsers} 
                />
              </div>
            </div>
          )}

          {/* Organization Tab */}
          {activeTab === 'organization' && <OrganizationTab />}

          {/* External API Test Tab */}
          {activeTab === 'external-api' && <ExternalApiTestTab />}

          {/* External LDAP Test Tab */}
          {activeTab === 'external-ldap' && <ExternalLdapTestTab />}
        </div>
      </div>
    </div>
  );
}