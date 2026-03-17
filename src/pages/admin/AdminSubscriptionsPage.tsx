import { useState, useEffect } from 'react';
import { Search, DollarSign, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { API_BASE } from '@/services/api-base';

const AdminSubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [filteredSubs, setFilteredSubs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchSubscriptions();
    fetchStats();
  }, []);

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, searchTerm, typeFilter, statusFilter]);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('foodintel_auth_tokens');
      if (!token) return;
      const { accessToken } = JSON.parse(token);
      const response = await fetch(`${API_BASE}/api/admin/subscriptions/all`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('foodintel_auth_tokens');
      if (!token) return;
      const { accessToken } = JSON.parse(token);
      const response = await fetch(`${API_BASE}/api/admin/subscriptions/stats`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data || { combined: {}, platform: {}, api: {} });
      } else {
        setStats({ combined: {}, platform: {}, api: {} });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({ combined: {}, platform: {}, api: {} });
    }
  };

  const filterSubscriptions = () => {
    let filtered = subscriptions;
    if (searchTerm) {
      filtered = filtered.filter(sub =>
        (sub.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.userName || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (typeFilter !== 'all') filtered = filtered.filter(sub => sub.type === typeFilter);
    if (statusFilter !== 'all') filtered = filtered.filter(sub => sub.status === statusFilter);
    setFilteredSubs(filtered);
  };

  const handleCancelSubscription = async (type: string, id: string) => {
    if (!confirm('Cancel this subscription?')) return;
    try {
      const token = localStorage.getItem('foodintel_auth_tokens');
      if (!token) return;
      const { accessToken } = JSON.parse(token);
      const response = await fetch(`${API_BASE}/api/admin/subscriptions/${type}/${id}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        alert('Subscription cancelled');
        fetchSubscriptions();
        fetchStats();
      }
    } catch (error) {
      alert('Failed to cancel subscription');
    }
  };

  const handleResetUsage = async (id: string) => {
    if (!confirm('Reset API usage to 0?')) return;
    try {
      const token = localStorage.getItem('foodintel_auth_tokens');
      if (!token) return;
      const { accessToken } = JSON.parse(token);
      const response = await fetch(`${API_BASE}/api/admin/subscriptions/api/${id}/reset-usage`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        alert('Usage reset');
        fetchSubscriptions();
      }
    } catch (error) {
      alert('Failed to reset usage');
    }
  };

  const handleExtendSubscription = async (id: string) => {
    const days = prompt('Extend by how many days?', '30');
    if (!days) return;
    try {
      const token = localStorage.getItem('foodintel_auth_tokens');
      if (!token) return;
      const { accessToken } = JSON.parse(token);
      const response = await fetch(`${API_BASE}/api/admin/subscriptions/api/${id}/extend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: parseInt(days) })
      });
      if (response.ok) {
        alert(`Extended by ${days} days`);
        fetchSubscriptions();
      }
    } catch (error) {
      alert('Failed to extend');
    }
  };

  const getUsagePercentage = (sub: any) => {
    if (sub.type === 'platform') {
      if (!sub.analysesLimit) return 0;
      return ((sub.analysesUsed || 0) / sub.analysesLimit) * 100;
    } else {
      if (sub.requestsLimit === -1) return 0;
      if (!sub.requestsLimit) return 0;
      return ((sub.requestsUsed || 0) / sub.requestsLimit) * 100;
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 90) return 'text-orange-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No subscription data available</p>
          <button onClick={() => { fetchSubscriptions(); fetchStats(); }} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Management</h1>
          <p className="text-gray-600">Manage platform and API subscriptions</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Subscriptions</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold">{stats.combined?.totalSubscriptions || 0}</p>
            <p className="text-sm text-gray-500 mt-1">{stats.combined?.totalActive || 0} active</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Platform Subs</span>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold">{stats.platform?.total || 0}</p>
            <p className="text-sm text-gray-500 mt-1">{stats.platform?.active || 0} active</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">API Subscriptions</span>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold">{stats.api?.total || 0}</p>
            <p className="text-sm text-gray-500 mt-1">{(stats.api?.totalRequests || 0).toLocaleString()} requests</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Monthly Revenue</span>
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold">₹{(stats.platform?.revenue || 0).toFixed(0)}</p>
            <p className="text-sm text-gray-500 mt-1">Platform only</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
              <option value="all">All Types</option>
              <option value="platform">Platform</option>
              <option value="api">API</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSubs.map((sub) => {
                const usagePercent = getUsagePercentage(sub);
                return (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{sub.userName || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{sub.userEmail || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        sub.type === 'platform' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {sub.type === 'platform' ? 'Platform' : 'API'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{sub.planName || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {sub.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {sub.type === 'platform' ? (
                        <div className="text-sm">
                          <div className={getUsageColor(usagePercent)}>
                            Analyses: {sub.analysesUsed || 0}/{sub.analysesLimit || 0}
                          </div>
                          {sub.apiRequestsLimit && (
                            <div className="text-gray-500">API: {sub.apiRequestsUsed || 0}/{sub.apiRequestsLimit || 0}</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm">
                          <div className={getUsageColor(usagePercent)}>
                            {(sub.requestsUsed || 0).toLocaleString()}/{sub.requestsLimit === -1 ? '∞' : (sub.requestsLimit || 0).toLocaleString()}
                          </div>
                          <div className="text-gray-500 text-xs">{sub.rateLimit || 0} req/min</div>
                          {(sub.lastNotifiedAt || 0) >= 80 && (
                            <div className="flex items-center text-orange-600 text-xs mt-1">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {sub.lastNotifiedAt}% alert sent
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'Lifetime'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        {sub.status === 'active' && (
                          <button onClick={() => handleCancelSubscription(sub.type, sub.id)} className="text-red-600 hover:text-red-800 font-medium">
                            Cancel
                          </button>
                        )}
                        {sub.type === 'api' && sub.status === 'active' && (
                          <>
                            <button onClick={() => handleResetUsage(sub.id)} className="text-blue-600 hover:text-blue-800 font-medium">
                              Reset
                            </button>
                            <button onClick={() => handleExtendSubscription(sub.id)} className="text-green-600 hover:text-green-800 font-medium">
                              Extend
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredSubs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No subscriptions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptionsPage;
