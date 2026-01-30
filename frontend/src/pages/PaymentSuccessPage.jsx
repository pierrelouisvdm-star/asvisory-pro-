import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription } from '@/context/SubscriptionContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

export const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activateSubscription = async () => {
      // Refresh subscription status
      await refreshSubscription();
      setLoading(false);
    };
    
    // Give PayFast webhook time to process
    const timer = setTimeout(activateSubscription, 2000);
    return () => clearTimeout(timer);
  }, [refreshSubscription]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-slate-400">Activating your premium access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center">
      <Card className="max-w-md w-full mx-4 border-emerald-500/50">
        <CardContent className="py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-slate-400 mb-8">
            Thank you for your purchase. Your lifetime premium access has been activated.
          </p>
          <Button 
            className="btn-premium"
            onClick={() => navigate('/')}
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
