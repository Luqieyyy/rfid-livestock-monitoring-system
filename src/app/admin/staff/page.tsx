'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface User {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  role: string;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: Date;
  details?: string;
}

interface RFIDLog {
  id: string;
  animalId: string;
  deviceId: string;
  device_name: string;
  rfid_tag: string;
  scan_result: string;
  timestamp: Date;
}

export default function StaffManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [rfidLogs, setRfidLogs] = useState<RFIDLog[]>([]);
  const [eatingLogs, setEatingLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const usersData = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid || doc.id,
          displayName: data.displayName || data.fullName || 'Unknown',
          email: data.email || 'N/A',
          role: data.role || 'farmer',
          photoUrl: data.photoUrl || data.photoURL,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
        } as User;
      });
      setUsers(usersData);

      // Load RFID logs (staff activity)
      const rfidRef = collection(db, 'rfid_logs');
      const rfidQuery = query(rfidRef, orderBy('timestamp', 'desc'));
      const rfidSnapshot = await getDocs(rfidQuery);
      const rfidData = rfidSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          animalId: data.animalId || 'N/A',
          deviceId: data.device_id || data.deviceId || 'N/A',
          device_name: data.device_name || 'Scanner',
          rfid_tag: data.rfid_tag || 'N/A',
          scan_result: data.scan_result || 'success',
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp || Date.now()),
        } as RFIDLog;
      });
      setRfidLogs(rfidData);

      // Load eating logs
      const eatingRef = collection(db, 'eating_logs');
      const eatingQuery = query(eatingRef, orderBy('timeEnd', 'desc'));
      const eatingSnapshot = await getDocs(eatingQuery);
      const eatingData = eatingSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timeEnd: data.timeEnd instanceof Timestamp ? data.timeEnd.toDate() : new Date(data.timeEnd || Date.now()),
          timeStart: data.timeStart instanceof Timestamp ? data.timeStart.toDate() : new Date(data.timeStart || Date.now()),
        };
      });
      setEatingLogs(eatingData);

      console.log('📊 Staff Management Data:', {
        users: usersData.length,
        rfidLogs: rfidData.length,
        eatingLogs: eatingData.length
      });

    } catch (error) {
      console.error('❌ Error loading staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesSearch = searchQuery === '' || 
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getUserActivityCount = (userId: string) => {
    return rfidLogs.filter(log => log.deviceId === userId).length;
  };

  const stats = {
    totalUsers: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    farmers: users.filter(u => u.role === 'farmer').length,
    totalScans: rfidLogs.length,
    todayScans: rfidLogs.filter(log => {
      const today = new Date();
      const logDate = new Date(log.timestamp);
      return logDate.toDateString() === today.toDateString();
    }).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading staff data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 mt-1">Monitor staff activities and access logs</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard icon="👥" label="Total Staff" value={stats.totalUsers} color="blue" />
        <StatsCard icon="👑" label="Admins" value={stats.admins} color="purple" />
        <StatsCard icon="🧑‍🌾" label="Farmers" value={stats.farmers} color="green" />
        <StatsCard icon="📊" label="Total Scans" value={stats.totalScans} color="cyan" />
        <StatsCard icon="📅" label="Today's Scans" value={stats.todayScans} color="orange" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="farmer">Farmer</option>
          </select>
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Staff Directory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                        {user.photoUrl ? (
                          <img src={user.photoUrl} alt={user.displayName} className="w-10 h-10 rounded-full" />
                        ) : (
                          <span className="text-lg font-bold text-emerald-600">
                            {user.displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.displayName}</p>
                        <p className="text-xs text-gray-500">UID: {user.uid.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-700">{user.email}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-700">{user.createdAt.toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      View Activity
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Logs */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* RFID Scan Logs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent RFID Scans</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {rfidLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📱</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{log.rfid_tag}</p>
                    <p className="text-xs text-gray-500">{log.device_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={log.scan_result} />
                  <p className="text-xs text-gray-500 mt-1">
                    {log.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Eating Activity Logs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Feeding Activity</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {eatingLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🍽️</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Animal ID: {log.animalId || 'N/A'}</p>
                    <p className="text-xs text-gray-500">
                      Duration: {log.duration ? `${log.duration} min` : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-700 font-medium">
                    {log.timeEnd ? new Date(log.timeEnd).toLocaleTimeString() : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {log.timeEnd ? new Date(log.timeEnd).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Activity Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                    {selectedUser.photoUrl ? (
                      <img src={selectedUser.photoUrl} alt={selectedUser.displayName} className="w-16 h-16 rounded-full" />
                    ) : (
                      <span className="text-2xl font-bold text-emerald-600">
                        {selectedUser.displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedUser.displayName}</h3>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">User Information</h4>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <RoleBadge role={selectedUser.role} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registered</p>
                  <p className="font-medium text-gray-900">{selectedUser.createdAt.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-medium text-gray-900 text-xs">{selectedUser.uid}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Activity Count</p>
                  <p className="font-medium text-gray-900">{getUserActivityCount(selectedUser.uid)} scans</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-100 to-indigo-100',
    purple: 'from-purple-100 to-violet-100',
    green: 'from-emerald-100 to-teal-100',
    cyan: 'from-cyan-100 to-blue-100',
    orange: 'from-amber-100 to-orange-100',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className={`w-12 h-12 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center mb-3`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    farmer: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize inline-block ${styles[role] || 'bg-gray-100 text-gray-700'}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    success: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
    error: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}
