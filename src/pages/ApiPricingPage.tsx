import { useState, useEffect, useRef } from 'react';
import { Check, Zap, TrendingUp, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/services/api-base';

interface Plan {
  id: string;
  name: string;
  price: number;
  requests: number;
  rate_limit: number;
  features: string[];
}


function getToken() {
  const t = localStorage.getItem('foodintel_auth_tokens');
  return t ? JSON.parse(t).accessToken : null;
}

const ApiPricingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const prevPricesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    fetchPlans();
    if (user) fetchCurrentSubscription();
    const interval = setInterval(() => fetchPlans(true), 60000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchPlans = async (isPolling = false) => {
    try {
      const response = await fetch(`${API_BASE}/api/api-pricing/plans`);
      const data = await response.json();
      const fetched: Record<string, Plan> = data.plans || {};
      if (isPolling) {
        for (const [id, plan] of Object.entries(fetched)) {
          const prev = prevPricesRef.current[id];
          if (prev !== undefined && prev !== plan.price) {
            toast({ title: 'API Price Updated', description: `${plan.name} plan price changed to ₹${(plan.price / 100).toFixed(0)}` });
          }
        }
      }
      prevPricesRef.current = Object.fromEntries(Object.entries(fetched).map(([id, p]) => [id, p.price]));
      setPlans(fetched);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const accessToken = getToken();
      if (!accessToken) return;
      const response = await fetch(`${API_BASE}/api/api-pricing/my-subscription`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();
      setCurrentSubscription(data.subscription);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const accessToken = getToken();
    if (!accessToken) { navigate('/login'); return; }

    setSubscribing(planId);

    try {
      // Subscribe to plan
      const response = await fetch(`${API_BASE}/api/api-pricing/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ plan_id: planId })
      });

      const data = await response.json();

      if (planId === 'free') {
        // Free plan - activated immediately
        alert('Free trial activated! You have 100 API requests.');
        navigate('/dashboard');
        return;
      }

      // Paid plan - show Razorpay
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'NutriSight AI',
        description: `${data.plan.name} API Subscription`,
        order_id: data.orderId,
        handler: async (response: any) => {
          // Verify payment
          const verifyResponse = await fetch(`${API_BASE}/api/api-pricing/verify-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              orderId: data.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            })
          });

          if (verifyResponse.ok) {
            alert('Payment successful! Your API subscription is now active.');
            navigate('/dashboard');
          }
        },
        theme: {
          color: '#2d5016'
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Subscription failed:', error);
      alert('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            API Pricing Plans
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your application. Start with 100 free requests to test all features.
          </p>
          
          {currentSubscription && (
            <div className="mt-6 inline-block bg-green-100 border border-green-300 rounded-lg px-6 py-3">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-semibold">
                  Current Plan: {currentSubscription.planName}
                </span>
              </div>
              <div className="mt-2 text-sm text-green-700">
                {currentSubscription.requestsRemaining === -1 ? (
                  'Unlimited requests'
                ) : (
                  <>
                    {currentSubscription.requestsUsed.toLocaleString()} / {currentSubscription.requestsLimit.toLocaleString()} requests used
                    {currentSubscription.requestsRemaining < 1000 && (
                      <span className="ml-2 text-orange-600 font-semibold">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        {currentSubscription.requestsRemaining} remaining
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {Object.entries(plans).map(([id, plan]) => (
            <div
              key={id}
              className={`bg-white rounded-lg shadow-lg p-8 ${
                id === 'professional' ? 'ring-2 ring-green-600 transform scale-105' : ''
              }`}
            >
              {id === 'professional' && (
                <div className="bg-green-600 text-white text-sm font-bold py-1 px-3 rounded-full inline-block mb-4">
                  POPULAR
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  ₹{plan.price === 0 ? '0' : (plan.price / 100).toFixed(0)}
                </span>
                {plan.price > 0 && <span className="text-gray-600">/month</span>}
              </div>

              <div className="mb-6">
                <div className="flex items-center text-gray-700 mb-2">
                  <Zap className="w-5 h-5 mr-2 text-green-600" />
                  <span className="font-semibold">
                    {plan.requests === -1 ? 'Unlimited' : plan.requests.toLocaleString()} requests
                  </span>
                </div>
                <div className="flex items-center text-gray-700">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  <span>{plan.rate_limit} req/min</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(id)}
                disabled={subscribing === id || (currentSubscription?.planId === id)}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  currentSubscription?.planId === id
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : id === 'professional'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {currentSubscription?.planId === id ? 'Current Plan' : subscribing === id ? 'Processing...' : id === 'free' ? 'Start Free Trial' : id === 'enterprise' ? 'Contact Sales' : 'Subscribe Now'}
              </button>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What You Get</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Complete ML/AI Suite
              </h3>
              <p className="text-gray-600">
                Access category prediction, brand prediction, similarity search, and Indian food database.
              </p>
            </div>

            <div>
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Secure & Reliable
              </h3>
              <p className="text-gray-600">
                SHA256 encrypted API keys, automatic rate limiting, and 99.9% uptime guarantee.
              </p>
            </div>

            <div>
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Real-time Analytics
              </h3>
              <p className="text-gray-600">
                Monitor your API usage, track requests, and manage your subscription from the dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Have questions? <a href="mailto:support@nutrisight.ai" className="text-green-600 hover:underline">Contact our sales team</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiPricingPage;
