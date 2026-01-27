import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { subscriptionApi } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SubscriptionSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [status, setStatus] = useState('checking'); // checking, success, error
  const [message, setMessage] = useState('Verifying your payment...');
  const [tier, setTier] = useState(null);

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      setStatus('error');
      setMessage('No session ID found');
    }
  }, [sessionId]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('error');
      setMessage('Payment verification timed out. Please check your email for confirmation.');
      return;
    }

    try {
      const result = await subscriptionApi.getCheckoutStatus(sessionId);

      if (result.payment_status === 'paid') {
        setStatus('success');
        setMessage('Payment successful! Your subscription is now active.');
        setTier(result.tier);
        return;
      }

      if (result.status === 'expired') {
        setStatus('error');
        setMessage('Payment session expired. Please try again.');
        return;
      }

      // Continue polling
      setMessage(`Verifying payment... (${attempts + 1}/${maxAttempts})`);
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Failed to verify payment');
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center">
          {status === 'checking' && (
            <>
              <Loader2 className="h-16 w-16 mx-auto text-blue-500 animate-spin mb-4" />
              <h2 className="text-xl font-semibold mb-2">Processing Payment</h2>
              <p className="text-slate-500">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="relative inline-block mb-4">
                <CheckCircle2 className="h-20 w-20 text-emerald-500" />
                <div className="absolute inset-0 animate-ping">
                  <CheckCircle2 className="h-20 w-20 text-emerald-500 opacity-30" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome to {tier?.charAt(0).toUpperCase() + tier?.slice(1)}!
              </h2>
              <p className="text-slate-500 mb-6">{message}</p>
              <div className="space-y-3">
                <Button 
                  className="w-full btn-premium"
                  onClick={() => navigate('/')}
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/clients')}
                >
                  Manage Clients
                </Button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Payment Issue</h2>
              <p className="text-slate-500 mb-6">{message}</p>
              <div className="space-y-3">
                <Button 
                  className="w-full"
                  onClick={() => navigate('/pricing')}
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/')}
                >
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
