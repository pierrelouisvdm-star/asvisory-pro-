import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const RefundPolicyPage = () => {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">
            <RefreshCw className="h-3 w-3 mr-1" />
            Refunds
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">Refund Policy</h1>
          <p className="text-muted-foreground">Last updated: April 2026</p>
        </div>

        {/* Quick Summary Card */}
        <Card className="border-emerald-500/30 bg-emerald-500/5 mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Quick Summary
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 flex-shrink-0">
                  <Clock className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Annual Plan</p>
                  <p className="text-sm text-muted-foreground">7-day refund policy</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 flex-shrink-0">
                  <RefreshCw className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Monthly Plan</p>
                  <p className="text-sm text-muted-foreground">Cancel anytime, no refunds</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-8 prose prose-invert max-w-none">
            <h2 className="text-xl font-semibold text-foreground mt-0">1. Overview</h2>
            <p className="text-muted-foreground">
              At AdvisoryPro, we want you to be completely satisfied with your subscription. This refund policy outlines the terms under which refunds are available for our different subscription plans.
            </p>

            <h2 className="text-xl font-semibold text-foreground">2. Annual Premium Plan (R1,499/year)</h2>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 my-4">
              <p className="text-emerald-400 font-semibold flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4" />
                7-Day Full Refund Guarantee
              </p>
              <p className="text-muted-foreground text-sm mb-0">
                If you're not satisfied with AdvisoryPro within the first 7 days of your annual subscription, you may request a full refund.
              </p>
            </div>
            <p className="text-muted-foreground">
              <strong>Eligibility Requirements:</strong>
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-2">
              <li>Refund request must be made within 7 calendar days of purchase</li>
              <li>Request must be submitted via email to support@advisorypro.co.za</li>
              <li>Include your registered email address and reason for refund</li>
            </ul>
            <p className="text-muted-foreground">
              <strong>After 7 Days:</strong> Annual subscriptions are non-refundable after the 7-day period. However, you retain full access until your subscription period ends.
            </p>

            <h2 className="text-xl font-semibold text-foreground">3. Monthly Premium Plan (R299/month)</h2>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 my-4">
              <p className="text-amber-400 font-semibold flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4" />
                No Refunds - Cancel Anytime
              </p>
              <p className="text-muted-foreground text-sm mb-0">
                Monthly subscriptions can be cancelled at any time, but are not eligible for refunds.
              </p>
            </div>
            <p className="text-muted-foreground">
              When you cancel your monthly subscription:
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-2">
              <li>You will not be charged for future months</li>
              <li>You retain access until the end of your current billing period</li>
              <li>No partial refunds are given for unused days</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground">4. Coupon Code Subscriptions</h2>
            <p className="text-muted-foreground">
              Subscriptions activated via promotional coupon codes (including lifetime access codes) are:
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-2">
              <li>Non-refundable</li>
              <li>Non-transferable</li>
              <li>Subject to the terms specified at time of promotion</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground">5. How to Request a Refund</h2>
            <p className="text-muted-foreground">
              To request a refund for an eligible annual subscription:
            </p>
            <ol className="text-muted-foreground list-decimal pl-6 space-y-2">
              <li>Send an email to <strong>support@advisorypro.co.za</strong></li>
              <li>Use subject line: "Refund Request - [Your Email]"</li>
              <li>Include your registered email address</li>
              <li>Briefly explain why you're requesting a refund</li>
              <li>We will respond within 2 business days</li>
            </ol>

            <h2 className="text-xl font-semibold text-foreground">6. Refund Processing</h2>
            <p className="text-muted-foreground">
              Once approved:
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-2">
              <li>Refunds are processed within 5-7 business days</li>
              <li>Refunds are issued to the original payment method</li>
              <li>Your account will be downgraded to the Free plan</li>
              <li>You may re-subscribe at any time</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground">7. Exceptions</h2>
            <p className="text-muted-foreground">
              Refunds may be denied if:
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-2">
              <li>The refund request is made after the eligible period</li>
              <li>There is evidence of abuse or fraudulent activity</li>
              <li>The account has been terminated for Terms of Service violations</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground">8. Service Interruptions</h2>
            <p className="text-muted-foreground">
              In the event of extended service outages (more than 24 consecutive hours) due to our fault, we may offer:
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-2">
              <li>Pro-rata credit extension to your subscription</li>
              <li>Partial refund at our discretion</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground">9. Contact Us</h2>
            <p className="text-muted-foreground">
              For refund inquiries or assistance:<br/>
              <strong>Email:</strong> support@advisorypro.co.za<br/>
              <strong>Response Time:</strong> Within 2 business days
            </p>

            <div className="bg-slate-800/50 rounded-lg p-4 mt-6">
              <p className="text-sm text-muted-foreground mb-0">
                <strong>Note:</strong> This refund policy is subject to change. Any changes will be communicated via email to active subscribers and updated on this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RefundPolicyPage;
