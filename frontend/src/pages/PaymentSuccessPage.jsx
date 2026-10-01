import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription } from '@/context/SubscriptionContext';
import { paymentsApi } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

export const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSubscription } = useSubscription();
  // Paystack appends both of these to the callback_url; either works as the reference.
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  const [status, setStatus] = useState('checking'); // checking, success, error
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    if (reference) {
      pollPaymentStatus(reference);
    } else {
      setStatus('error');
      setMessage('No payment reference found.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  const pollPaymentStatus = async (ref, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('error');
      setMessage('Payment verification timed out. Please check your email for confirmation.');
      return;
    }

    try {
      const result = await paymentsApi.getPaystackStatus(ref);

      if (result.processed && result.status === 'success') {
        await refreshSubscription();
        setStatus('success');
        setMessage('Payment successful! Your premium access is now active.');
        return;
      }

      setMessage(`Verifying payment... (${attempts + 1}/${maxAttempts})`);
      setTimeout(() => pollPaymentStatus(ref, attempts + 1), pollInterval);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Failed to verify payment');
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="py-12 text-center">
          {status === 'checking' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
              <p className="text-slate-400">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
              <p className="text-slate-400 mb-8">{message}</p>
              <Button className="btn-premium" onClick={() => navigate('/')}>
                Go to Dashboard
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Payment Issue</h1>
              <p className="text-slate-400 mb-8">{message}</p>
              <div className="space-y-3">
                <Button className="w-full btn-premium" onClick={() => navigate('/pricing')}>
                  Try Again
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                  Go to Dashboard
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
