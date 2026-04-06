import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle2, Users, Gift, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const REWARD_TIERS = [
  { count: 1, label: '1 referral', reward: 'Thank you badge + priority support' },
  { count: 3, label: '3 referrals', reward: '1 month Premium free' },
  { count: 10, label: '10 referrals', reward: 'Full year Premium free' },
];

export default function ReferralWidget() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState(null);
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetchOrCreate = async () => {
      try {
        const res = await fetch(`${API_URL}/api/growth/referral`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, user_email: user.email }),
        });
        const data = await res.json();
        setReferralCode(data.referral_code);
        setReferralCount(data.referral_count || 0);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchOrCreate();
  }, [user?.id, user?.email]);

  const referralLink = referralCode
    ? `${window.location.origin}/auth?ref=${referralCode}`
    : null;

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!referralLink) return;
    const text = `I've been using AdvisoryPro for my financial planning — 30+ US calculators including FIRE, RSU taxes, paycheck, home affordability, and more. Try it free: ${referralLink}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const nextTier = REWARD_TIERS.find(t => t.count > referralCount) || REWARD_TIERS[REWARD_TIERS.length - 1];
  const progress = nextTier ? (referralCount / nextTier.count) * 100 : 100;

  if (loading) return null;

  return (
    <Card className="border-border bg-card" data-testid="referral-widget">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gift className="h-4 w-4 text-amber-500" />
          Refer Friends &amp; Earn Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">{referralCount} friends referred</span>
            <span className="text-amber-500 font-medium">Next: {nextTier.count} → {nextTier.reward.split(' ').slice(0, 3).join(' ')}...</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
        </div>

        {/* Referral link */}
        {referralCode ? (
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 rounded-lg border border-border bg-muted/30 text-xs text-muted-foreground truncate font-mono">
              {referralLink}
            </div>
            <Button size="sm" variant="outline" onClick={handleCopy} className="flex-shrink-0" data-testid="referral-copy-btn">
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <Button size="sm" variant="outline" onClick={handleShare} className="flex-shrink-0">
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Sign in to get your referral link</p>
        )}

        {/* Reward tiers */}
        <div className="space-y-1.5">
          {REWARD_TIERS.map((tier, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs ${referralCount >= tier.count ? 'opacity-50 line-through' : ''}`}>
              <div className={`flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0 ${referralCount >= tier.count ? 'bg-emerald-500' : 'bg-muted border border-border'}`}>
                {referralCount >= tier.count
                  ? <CheckCircle2 className="h-3 w-3 text-white" />
                  : <span className="text-muted-foreground text-[10px] font-bold">{tier.count}</span>
                }
              </div>
              <span className={referralCount >= tier.count ? 'text-muted-foreground' : 'text-foreground'}>{tier.reward}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
