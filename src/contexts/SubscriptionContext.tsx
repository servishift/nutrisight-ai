import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface SubscriptionLimits {
  analyses_per_month: number;
  batch_rows_per_month: number;
  api_requests_per_month: number;
  rate_limit_per_minute: number;
}

interface Subscription {
  id: string;
  planId: string;
  planName: string;
  status: string;
  limits: SubscriptionLimits;
  usedAnalyses: number;
  usedBatchRows: number;
  usedApiRequests: number;
  endDate?: string;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  hasFeature: (feature: string) => boolean;
  canUseFeature: (feature: string) => { allowed: boolean; reason?: string };
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const tokens = localStorage.getItem('foodintel_auth_tokens');
      if (!tokens) {
        setSubscription(null);
        setLoading(false);
        return;
      }
      
      const { accessToken } = JSON.parse(tokens);
      const response = await fetch(`/api/payment/subscription`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [user]);

  const hasFeature = (feature: string): boolean => {
    if (!subscription) return false;
    
    // Free plan features
    const freeFeatures = [
      'ingredient_analysis',
      'allergen_detection',
      'clean_label_score',
      'health_risk_score',
      'nutrition_lookup',
      'additive_database'
    ];

    if (subscription.planId === 'free') {
      return freeFeatures.includes(feature) && feature !== 'diet_engine';
    }

    // Pro and Enterprise have all features
    return true;
  };

  const canUseFeature = (feature: string): { allowed: boolean; reason?: string } => {
    if (!subscription) {
      return { allowed: false, reason: 'No active subscription' };
    }

    if (!hasFeature(feature)) {
      return { allowed: false, reason: 'Feature not available in your plan. Please upgrade.' };
    }

    // Check usage limits
    if (feature === 'ingredient_analysis') {
      const limit = subscription.limits.analyses_per_month;
      const used = subscription.usedAnalyses || 0;
      if (limit !== -1 && used >= limit) {
        return { allowed: false, reason: 'Monthly analysis limit reached. Please upgrade.' };
      }
    }

    if (feature === 'api_access') {
      const limit = subscription.limits.api_requests_per_month;
      const used = subscription.usedApiRequests || 0;
      if (limit === 0) {
        return { allowed: false, reason: 'API access not available in your plan.' };
      }
      if (limit !== -1 && used >= limit) {
        return { allowed: false, reason: 'API limit reached. Please upgrade.' };
      }
    }

    return { allowed: true };
  };

  return (
    <SubscriptionContext.Provider value={{ subscription, loading, refreshSubscription, hasFeature, canUseFeature }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}
