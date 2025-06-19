'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authTest, setAuthTest] = useState({ email: '', password: '', result: null });
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    cn: '',
    givenName: '',
    sn: '',
    telephoneNumber: '',
    role: 'user'
  });

  // ユーザー一覧の取得
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ldap/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  // 認証テスト
  const testAuthentication = async () => {
    if (!authTest.email || !authTest.password) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ldap/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authTest.email,
          password: authTest.password
        })
      });
      const data = await response.json();
      setAuthTest(prev => ({ ...prev, result: data }));
    } catch (error) {
      setAuthTest(prev => ({ ...prev, result: { success: false, message: error.message } }));
    }
    setLoading(false);
  };

  // 新しいユーザーの追加
  const addUser = async () => {
    if (!newUser.email || !newUser.password) return;
    
    setLoading(true);
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
            role: newUser.role
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        setNewUser({
          email: '',
          password: '',
          cn: '',
          givenName: '',
          sn: '',
          telephoneNumber: '',
          role: 'user'
        });
        fetchUsers();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  // ユーザーの削除
  const deleteUser = async (email) => {
    if (!confirm(`Are you sure you want to delete user: ${email}?`)) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/ldap/users/${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔐 SimpleLDAP - Test Environment
        </h1>

        {/* 統計情報 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-blue-600">Total Users</h3>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-green-600">Admin Users</h3>
              <p className="text-2xl font-bold">{stats.adminUsers}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-purple-600">Regular Users</h3>
              <p className="text-2xl font-bold">{stats.regularUsers}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 認証テスト */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🧪 Authentication Test</h2>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                className="w-full p-2 border border-gray-300 rounded"
                value={authTest.email}
                onChange={(e) => setAuthTest(prev => ({ ...prev, email: e.target.value }))}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-2 border border-gray-300 rounded"
                value={authTest.password}
                onChange={(e) => setAuthTest(prev => ({ ...prev, password: e.target.value }))}
              />
              <button
                onClick={testAuthentication}
                disabled={loading}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Test Authentication
              </button>
              {authTest.result && (
                <div className={`p-3 rounded ${authTest.result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <strong>{authTest.result.success ? '✅ Success' : '❌ Failed'}</strong>
                  <p>{authTest.result.message}</p>
                  {authTest.result.user && (
                    <div className="mt-2 text-sm">
                      <p>User: {authTest.result.user.attributes?.cn}</p>
                      <p>Role: {authTest.result.user.attributes?.role}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 新しいユーザーの追加 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">➕ Add New User</h2>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email *"
                className="w-full p-2 border border-gray-300 rounded"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              />
              <input
                type="password"
                placeholder="Password *"
                className="w-full p-2 border border-gray-300 rounded"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Full Name (cn)"
                className="w-full p-2 border border-gray-300 rounded"
                value={newUser.cn}
                onChange={(e) => setNewUser(prev => ({ ...prev, cn: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="First Name"
                  className="p-2 border border-gray-300 rounded"
                  value={newUser.givenName}
                  onChange={(e) => setNewUser(prev => ({ ...prev, givenName: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="p-2 border border-gray-300 rounded"
                  value={newUser.sn}
                  onChange={(e) => setNewUser(prev => ({ ...prev, sn: e.target.value }))}
                />
              </div>
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full p-2 border border-gray-300 rounded"
                value={newUser.telephoneNumber}
                onChange={(e) => setNewUser(prev => ({ ...prev, telephoneNumber: e.target.value }))}
              />
              <select
                className="w-full p-2 border border-gray-300 rounded"
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={addUser}
                disabled={loading}
                className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                Add User
              </button>
            </div>
          </div>
        </div>

        {/* ユーザー一覧 */}
        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">👥 Users</h2>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Phone</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.email} className="border-t">
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">{user.attributes.cn}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.attributes.role === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.attributes.role}
                        </span>
                      </td>
                      <td className="px-4 py-2">{user.attributes.telephoneNumber || '-'}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => deleteUser(user.email)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* デフォルトテストアカウント */}
        <div className="bg-blue-50 p-4 rounded-lg mt-8">
          <h3 className="font-semibold text-blue-800 mb-2">🔑 Default Test Accounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Admin:</strong><br />
              admin@example.com / admin123
            </div>
            <div>
              <strong>User:</strong><br />
              user@example.com / user123
            </div>
            <div>
              <strong>Test:</strong><br />
              test@example.com / test123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}