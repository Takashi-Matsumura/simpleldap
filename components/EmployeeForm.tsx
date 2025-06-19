import React, { useState } from 'react';
import { NewEmployeeForm } from '@/types/employee';

interface EmployeeFormProps {
  loading: boolean;
  onSubmit: (employee: NewEmployeeForm) => Promise<boolean>;
}

const initialFormState: NewEmployeeForm = {
  email: '',
  password: '',
  cn: '',
  givenName: '',
  sn: '',
  telephoneNumber: '',
  role: 'employee',
  // 社員情報
  employeeNumber: '',
  department: '',
  division: '',
  title: '',
  manager: '',
  employeeType: '正社員',
  mobile: '',
  physicalDeliveryOfficeName: '',
  costCenter: '',
  hireDate: '',
  jobCode: ''
};

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ loading, onSubmit }) => {
  const [newUser, setNewUser] = useState<NewEmployeeForm>(initialFormState);

  const handleSubmit = async () => {
    const success = await onSubmit(newUser);
    if (success) {
      setNewUser(initialFormState);
    }
  };

  const updateField = (field: keyof NewEmployeeForm, value: string) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="xl:col-span-1 bg-gray-50 p-6 rounded-lg max-h-[800px] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4">👤 Add New Employee</h3>
      <div className="space-y-4">
        {/* 基本情報 */}
        <div className="border-b pb-4 mb-4">
          <h4 className="font-medium text-gray-700 mb-3 text-sm">基本情報</h4>
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Email *"
              className="w-full p-2 border border-gray-300 rounded text-sm"
              value={newUser.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
            <input
              type="password"
              placeholder="Password *"
              className="w-full p-2 border border-gray-300 rounded text-sm"
              value={newUser.password}
              onChange={(e) => updateField('password', e.target.value)}
            />
            <input
              type="text"
              placeholder="表示名 (cn)"
              className="w-full p-2 border border-gray-300 rounded text-sm"
              value={newUser.cn}
              onChange={(e) => updateField('cn', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="名"
                className="p-2 border border-gray-300 rounded text-sm"
                value={newUser.givenName}
                onChange={(e) => updateField('givenName', e.target.value)}
              />
              <input
                type="text"
                placeholder="姓"
                className="p-2 border border-gray-300 rounded text-sm"
                value={newUser.sn}
                onChange={(e) => updateField('sn', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 社員情報 */}
        <div className="border-b pb-4 mb-4">
          <h4 className="font-medium text-gray-700 mb-3 text-sm">社員情報</h4>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="社員番号"
              className="w-full p-2 border border-gray-300 rounded text-sm"
              value={newUser.employeeNumber}
              onChange={(e) => updateField('employeeNumber', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="部署"
                className="p-2 border border-gray-300 rounded text-sm"
                value={newUser.department}
                onChange={(e) => updateField('department', e.target.value)}
              />
              <input
                type="text"
                placeholder="部門"
                className="p-2 border border-gray-300 rounded text-sm"
                value={newUser.division}
                onChange={(e) => updateField('division', e.target.value)}
              />
            </div>
            <input
              type="text"
              placeholder="役職"
              className="w-full p-2 border border-gray-300 rounded text-sm"
              value={newUser.title}
              onChange={(e) => updateField('title', e.target.value)}
            />
            <select
              className="w-full p-2 border border-gray-300 rounded text-sm"
              value={newUser.employeeType}
              onChange={(e) => updateField('employeeType', e.target.value as '正社員' | '契約社員' | '役員')}
            >
              <option value="正社員">正社員</option>
              <option value="契約社員">契約社員</option>
              <option value="役員">役員</option>
            </select>
          </div>
        </div>

        {/* 連絡先 */}
        <div className="border-b pb-4 mb-4">
          <h4 className="font-medium text-gray-700 mb-3 text-sm">連絡先</h4>
          <div className="space-y-2">
            <input
              type="tel"
              placeholder="内線番号"
              className="w-full p-2 border border-gray-300 rounded text-sm"
              value={newUser.telephoneNumber}
              onChange={(e) => updateField('telephoneNumber', e.target.value)}
            />
            <input
              type="tel"
              placeholder="会社携帯"
              className="w-full p-2 border border-gray-300 rounded text-sm"
              value={newUser.mobile}
              onChange={(e) => updateField('mobile', e.target.value)}
            />
            <input
              type="text"
              placeholder="勤務地"
              className="w-full p-2 border border-gray-300 rounded text-sm"
              value={newUser.physicalDeliveryOfficeName}
              onChange={(e) => updateField('physicalDeliveryOfficeName', e.target.value)}
            />
          </div>
        </div>

        {/* システム権限 */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-3 text-sm">システム権限</h4>
          <select
            className="w-full p-2 border border-gray-300 rounded text-sm"
            value={newUser.role}
            onChange={(e) => updateField('role', e.target.value as 'admin' | 'manager' | 'employee')}
          >
            <option value="employee">一般社員</option>
            <option value="manager">管理者</option>
            <option value="admin">システム管理者</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50 font-medium text-sm"
        >
          {loading ? '追加中...' : '社員を追加'}
        </button>
      </div>
    </div>
  );
};