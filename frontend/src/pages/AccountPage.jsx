import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  User, Mail, Building2, Crown, Calendar, CreditCard, ArrowRight,
  CheckCircle2, Flame, Globe2, Loader2, Undo2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useJurisdiction } from '@/context/JurisdictionContext';
import { paymentsApi } from '@/services/api';

const CURRENCY_SYMBOL = { usd: '$', zar: 'R' };

const AccountPage = () => {
  const { user } = useAuth();
  const { subscription, refreshSubscription } = useSubscription();
  const { isUS } = useJurisdiction();
  const [refunding, setRefunding] = useState(false);

  const handleRefund = async () => {
    setRefunding(true);
    try {
      const result = await paymentsApi.requestRefund();
      toast.success(result.message || 'Your refund has been processed.');
      await refreshSubscription();
    } catch (err) {
      toast.error(err.message || 'Failed to process refund');
    } finally {
      setRefunding(false);
    }
  };

  if (subscription.loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const isPremium = subscription.tier === 'premium';
  const currencySymbol = CURRENCY_SYMBOL[subscription.currency] || (isUS ? '$' : 'R');

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(isUS ? 'en-US' : 'en-ZA', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const renewalDate = formatDate(subscription.currentPeriodEnd);
  const displayPrice = subscription.foundingPrice ?? subscription.lastPaymentAmount;

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="account-page">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <User className="h-7 w-7 text-primary" />
          My Account
        </h1>
        <p className="text-muted-foreground mt-1">Your profile and subscription details</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="text-foreground font-medium">{user?.full_name || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-foreground font-medium">{user?.email || '—'}</p>
            </div>
          </div>
          {user?.company && (
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Company</p>
                <p className="text-foreground font-medium">{user.company}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">Subscription</CardTitle>
            <Badge className={isPremium ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' : 'bg-muted text-muted-foreground'}>
              {isPremium ? <Crown className="h-3 w-3 mr-1" /> : null}
              {isPremium ? 'Premium' : 'Free'}
            </Badge>
          </div>
          <CardDescription>
            {isPremium ? 'Full access to every tool, calculator and report' : 'Limited access — upgrade any time for the full suite'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPremium && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                {displayPrice != null && (
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="text-foreground font-medium">
                        {currencySymbol}{displayPrice}
                        {subscription.billingCycle ? ` / ${subscription.billingCycle === 'annual' ? 'year' : 'month'}` : ''}
                      </p>
                    </div>
                  </div>
                )}
                {renewalDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {subscription.status === 'active' ? 'Renews on' : 'Expired on'}
                      </p>
                      <p className="text-foreground font-medium">{renewalDate}</p>
                    </div>
                  </div>
                )}
              </div>

              {subscription.foundingMember && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <Flame className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-600">
                    Founding member — your price is locked in forever, every renewal
                    {subscription.prioritySupport ? ', plus priority support' : ''}.
                  </p>
                </div>
              )}
              {subscription.founderNumber != null && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <Globe2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    Founding Member #{String(subscription.founderNumber).padStart(4, '0')} of the Advisory Pro Founders Network
                  </p>
                </div>
              )}

              {subscription.refundEligible && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <Undo2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      You're within the 7-day money-back guarantee on your first annual plan
                      {subscription.refundDeadline ? `, until ${formatDate(subscription.refundDeadline)}` : ''}.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="mt-2">
                          Request Refund
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Request a refund?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This refunds {currencySymbol}{subscription.lastPaymentAmount} to your original payment
                            method and immediately moves your account back to the Free plan
                            {subscription.foundingMember ? ', including your locked-in founding price and Founders Network number' : ''}.
                            This can't be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleRefund} disabled={refunding}>
                            {refunding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Confirm Refund
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                Need to change or cancel your plan? Email{' '}
                <a href="mailto:support@advisorypro.co.za" className="text-primary hover:underline">
                  support@advisorypro.co.za
                </a>
                {' '}and we'll sort it out.
              </p>
            </>
          )}

          {!isPremium && (
            <>
              <ul className="space-y-2">
                {[
                  isUS ? 'FI Score Quiz, Tax Calendar & 5 more free calculators' : '5 free calculators, including TFSA and Bond',
                  'No PDF reports or AI Assistant on the free plan',
                ].map((line) => (
                  <li key={line} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                    {line}
                  </li>
                ))}
              </ul>
              <Link to="/pricing">
                <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  Upgrade to Premium
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountPage;
