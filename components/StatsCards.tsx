import React from 'react';
import { EmployeeStats } from '@/types/employee';

interface StatsCardsProps {
  stats: EmployeeStats | null;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-blue-600">Total Employees</h3>
        <p className="text-2xl font-bold">{stats.totalUsers}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-green-600">Managers</h3>
        <p className="text-2xl font-bold">{stats.adminUsers}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-purple-600">Regular Employees</h3>
        <p className="text-2xl font-bold">{stats.regularUsers}</p>
      </div>
    </div>
  );
};