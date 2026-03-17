import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Zap, Clock, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PageLayout from '@/components/layout/PageLayout';
import { API_BASE } from '@/services/api-base';

interface UsageStats {
  totalRequests: number;
  requestsUsed: number;
  requestsLimit: number;
  requestsRemaining: number;
  planName: string;
}

interface PlatformSubscription {
  planName: string;
  analysesUsed: number;
  analysesLimit: number;
  apiRequestsUsed: number;
  apiRequestsLimit: number;
  status: string;
}


function getToken() {
  const t = localStorage.getItem('foodintel_auth_tokens');
  return t ? JSON.parse(t).accessToken : null;
}

const ApiUsagePage = () => {
  const { user } = useAuth();
  const [apiUsage, setApiUsage] = useState<UsageStats | null>(null);
  const [platformSub, setPlatformSub] = useState<PlatformSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
    fetchPlatformSubscription();
  }, []);

  const fetchUsage = async () => {
    try {
      const accessToken = getToken();
      if (!accessToken) return;

      const response = await fetch(`${API_BASE}/api/api-pricing/usage`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApiUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch API usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformSubscription = async () => {
    try {
      const accessToken = getToken();
      if (!accessToken) return;

      const response = await fetch(`${API_BASE}/api/payment/subscription`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.subscription) {
          setPlatformSub(data.subscription);
        }
      }
    } catch (error) {
      console.error('Failed to fetch platform subscription:', error);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading usage statistics...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  const usagePercentage = apiUsage && apiUsage.requestsLimit > 0
    ? (apiUsage.requestsUsed / apiUsage.requestsLimit) * 100
    : 0;

  const platformUsagePercent = platformSub && platformSub.analysesLimit > 0
    ? (platformSub.analysesUsed / platformSub.analysesLimit) * 100
    : 0;

  return (
    <PageLayout>
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Usage Dashboard</h1>
          <p className="text-gray-600">Monitor your platform and API usage</p>
        </div>

        {/* Platform Subscription */}
        {platformSub && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Package className="w-6 h-6 mr-2 text-blue-600" />
              Platform Subscription
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">Current Plan</span>
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{platformSub.planName}</p>
                <p className="text-sm text-gray-500 mt-1">{platformSub.status}</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">Analyses Used</span>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {(platformSub.analysesUsed || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">of {(platformSub.analysesLimit || 0).toLocaleString()}</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">API Requests</span>
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {(platformSub.apiRequestsUsed || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">of {(platformSub.apiRequestsLimit || 0).toLocaleString()}</p>
              </div>
            </div>

            {platformSub.analysesLimit > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Usage</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{(platformSub.analysesUsed || 0).toLocaleString()} used</span>
                    <span>{(platformSub.analysesLimit || 0).toLocaleString()} total</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-6 rounded-full transition-all flex items-center justify-end pr-2 ${
                        platformUsagePercent >= 100 ? 'bg-red-600' :
                        platformUsagePercent >= 90 ? 'bg-orange-600' :
                        platformUsagePercent >= 80 ? 'bg-yellow-600' :
                        'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(platformUsagePercent, 100)}%` }}
                    >
                      <span className="text-white text-xs font-bold">
                        {platformUsagePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {((platformSub.analysesLimit || 0) - (platformSub.analysesUsed || 0)).toLocaleString()} analyses remaining
                    </p>
                    {platformUsagePercent < 80 ? (
                      <span className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Healthy
                      </span>
                    ) : platformUsagePercent < 100 ? (
                      <span className="flex items-center text-orange-600 text-sm">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Running Low
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600 text-sm font-bold">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Limit Reached
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* API Subscription */}
        {apiUsage && apiUsage.planName !== 'None' ? (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-purple-600" />
              API Subscription
            </h2>
            <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">Current Plan</span>
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{apiUsage.planName}</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">Requests Used</span>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {apiUsage.requestsUsed.toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">Requests Limit</span>
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {apiUsage.requestsLimit === -1 ? 'Unlimited' : apiUsage.requestsLimit.toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">Remaining</span>
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {apiUsage.requestsRemaining === -1 ? 'Unlimited' : apiUsage.requestsRemaining.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Usage Progress */}
            {apiUsage.requestsLimit > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Progress</h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{apiUsage.requestsUsed.toLocaleString()} used</span>
                    <span>{apiUsage.requestsLimit.toLocaleString()} total</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-6 rounded-full transition-all flex items-center justify-end pr-2 ${
                        usagePercentage >= 100 ? 'bg-red-600' :
                        usagePercentage >= 90 ? 'bg-orange-600' :
                        usagePercentage >= 80 ? 'bg-yellow-600' :
                        'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    >
                      <span className="text-white text-xs font-bold">
                        {usagePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {apiUsage.requestsRemaining.toLocaleString()} requests remaining
                    </p>
                    {usagePercentage < 80 ? (
                      <span className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Healthy
                      </span>
                    ) : usagePercentage < 100 ? (
                      <span className="flex items-center text-orange-600 text-sm">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Running Low
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600 text-sm font-bold">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Limit Reached
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Alert Banners */}
            {apiUsage.requestsLimit > 0 && usagePercentage >= 100 && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-900 mb-2">
                      API Limit Reached
                    </h3>
                    <p className="text-red-800 mb-4">
                      You've used all {apiUsage.requestsLimit.toLocaleString()} requests in your {apiUsage.planName} plan. 
                      All API requests are now blocked. Upgrade to continue using the API.
                    </p>
                    <a
                      href="/api-pricing"
                      className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                    >
                      Upgrade Now →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {apiUsage.requestsLimit > 0 && usagePercentage >= 90 && usagePercentage < 100 && (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-orange-900 mb-2">
                      90% Usage Alert
                    </h3>
                    <p className="text-orange-800 mb-4">
                      You've used {apiUsage.requestsUsed.toLocaleString()} of {apiUsage.requestsLimit.toLocaleString()} requests ({usagePercentage.toFixed(1)}%). 
                      Only {apiUsage.requestsRemaining.toLocaleString()} requests remaining. Upgrade to avoid service interruption.
                    </p>
                    <a
                      href="/api-pricing"
                      className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                    >
                      View Plans →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {apiUsage.requestsLimit > 0 && usagePercentage >= 80 && usagePercentage < 90 && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-yellow-900 mb-2">
                      80% Usage Alert
                    </h3>
                    <p className="text-yellow-800 mb-4">
                      You've used {apiUsage.requestsUsed.toLocaleString()} of {apiUsage.requestsLimit.toLocaleString()} requests ({usagePercentage.toFixed(1)}%). 
                      Consider upgrading your plan for more capacity.
                    </p>
                    <a
                      href="/api-pricing"
                      className="inline-block bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
                    >
                      Upgrade Plan →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">No API subscription found</p>
            <a
              href="/api-pricing"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Subscribe to API Plan
            </a>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ApiUsagePage;
