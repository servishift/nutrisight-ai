import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export default function VerifyOTPPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as { email?: string })?.email || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError('Please enter the full 6-digit code');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { verifyOTP, storeTokens, storeUser } = await import('@/services/auth-service');
      const result = await verifyOTP({ email, otp });
      storeTokens(result.tokens);
      storeUser(result.user);
      navigate('/analyzer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      const { resendOTP } = await import('@/services/auth-service');
      const result = await resendOTP(email);
      setSuccess(result.message || 'Code resent successfully');
      setCountdown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>

        <h2 className="mb-1 font-display text-2xl font-bold text-foreground">Verify your email</h2>
        <p className="mb-8 text-sm text-muted-foreground">
          We sent a 6-digit code to{' '}
          <span className="font-medium text-foreground">{email || 'your email'}</span>
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
            {success}
          </div>
        )}

        <div className="mb-6 flex justify-center">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button onClick={handleVerify} className="w-full" disabled={loading || otp.length < 6}>
          {loading ? 'Verifying…' : 'Verify email'}
        </Button>

        <div className="mt-4">
          {countdown > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend code in <span className="font-medium text-foreground">{countdown}s</span>
            </p>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleResend} disabled={resending}>
              {resending ? 'Sending…' : 'Resend code'}
            </Button>
          )}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">Back to login</Link>
        </p>
      </motion.div>
    </div>
  );
}
