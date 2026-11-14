import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getDashboardStats } from '@/services/adminService';

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const data = await getDashboardStats();
        if (isMounted) {
          setStats(data);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
        if (isMounted) {
          setError('Could not load dashboard statistics. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadStats();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const refreshStats = () => {
    setLoading(true);
    setRefreshKey((key) => key + 1);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pepper"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-waakye-dark">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening today.</p>
        </div>

        {error && (
          <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-lg bg-pepper/10 p-4 text-pepper sm:flex-row sm:items-center" role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={refreshStats}
              className="rounded-lg bg-pepper px-4 py-2 font-semibold text-white transition-colors hover:bg-pepper-light"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Orders */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">📦</span>
              <span className="text-xs font-semibold text-leaf bg-leaf/10 px-2 py-1 rounded-full">
                TODAY
              </span>
            </div>
            <p className="text-3xl font-bold text-waakye-dark">{stats?.todayOrders || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Today's Orders</p>
          </div>

          {/* Today's Revenue */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">💰</span>
              <span className="text-xs font-semibold text-leaf bg-leaf/10 px-2 py-1 rounded-full">
                TODAY
              </span>
            </div>
            <p className="text-3xl font-bold text-waakye-dark">
              GH₵ {(stats?.todayRevenue || 0).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Today's Revenue</p>
          </div>

          {/* Total Orders */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-waakye-dark">{stats?.totalOrders || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Total Orders</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">💎</span>
            </div>
            <p className="text-3xl font-bold text-waakye-dark">
              GH₵ {(stats?.totalRevenue || 0).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
          </div>
        </div>

        {/* Pending Orders Alert */}
        {stats && stats.pendingOrders > 0 && (
          <div className="bg-plantain/20 border border-plantain/30 p-6 rounded-2xl">
            <div className="flex items-center gap-4">
              <span className="text-4xl">⚠️</span>
              <div>
                <h3 className="text-lg font-bold text-waakye-dark">
                  {stats.pendingOrders} Pending Order{stats.pendingOrders > 1 ? 's' : ''}
                </h3>
                <p className="text-gray-700 text-sm mt-1">
                  You have orders waiting to be confirmed. Check the Orders page to manage them.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;