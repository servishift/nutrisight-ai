import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutButtonProps {
  planId: string;
  planName: string;
  price: number;
  disabled?: boolean;
}

export function CheckoutButton({ planId, planName, price, disabled }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { refreshSubscription } = useSubscription();
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!user) {
      toast({ title: 'Please login first', variant: 'destructive' });
      return;
    }

    const tokens = localStorage.getItem('foodintel_auth_tokens');
    if (!tokens) {
      toast({ title: 'Please login first', variant: 'destructive' });
      return;
    }
    
    const { accessToken } = JSON.parse(tokens);

    if (planId === 'free') {
      // Activate free plan directly
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/payment/subscribe`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ planId: 'free' })
        });

        if (response.ok) {
          await refreshSubscription();
          toast({ title: 'Free plan activated!' });
        }
      } catch (error) {
        toast({ title: 'Failed to activate plan', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (planId === 'enterprise') {
      window.location.href = 'mailto:sales@nutrisight.ai?subject=Enterprise Plan Inquiry';
      return;
    }

    // Pro plan - Razorpay checkout
    try {
      setLoading(true);

      // Create order
      const orderResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/payment/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId })
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        toast({ title: error.message || 'Failed to create order', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const orderData = await orderResponse.json();

      if (!orderData.keyId || !orderData.orderId) {
        toast({ title: 'Invalid order response', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'NutriSight AI',
          description: `${planName} Plan Subscription`,
          order_id: orderData.orderId,
          handler: async function (response: any) {
            // Verify payment
            try {
              const verifyResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/payment/verify`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature
                })
              });

              if (verifyResponse.ok) {
                await refreshSubscription();
                toast({ title: 'Subscription activated successfully!' });
                window.location.href = '/dashboard';
              } else {
                toast({ title: 'Payment verification failed', variant: 'destructive' });
              }
            } catch (error) {
              toast({ title: 'Payment verification failed', variant: 'destructive' });
            }
          },
          prefill: {
            email: user.email,
            name: user.displayName
          },
          theme: {
            color: '#2d5016'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setLoading(false);
      };
    } catch (error) {
      toast({ title: 'Failed to create order', variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSubscribe}
      disabled={disabled || loading}
      className="w-full"
    >
      {loading ? 'Processing...' : planId === 'free' ? 'Start Free' : planId === 'enterprise' ? 'Contact Sales' : 'Subscribe Now'}
    </Button>
  );
}
