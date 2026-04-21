import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const TermsOfServicePage = () => {
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
            <FileText className="h-3 w-3 mr-1" />
            Legal
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: April 2026</p>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-8 prose prose-invert max-w-none">
            <h2 className="text-xl font-semibold text-foreground mt-0">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using AdvisoryPro (advisorypro.co.za), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.
            </p>

            <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
            <p className="text-muted-foreground">
              AdvisoryPro provides financial calculation tools, tax planning resources, and educational content for South African users. Our services include:
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-2">
              <li>20+ financial calculators (retirement, tax, investment, debt management)</li>
              <li>Tax Planning Hub with 2026/2027 SARS tax tables</li>
              <li>Income and expense tracking with receipt scanning</li>
              <li>Market data and financial insights</li>
              <li>AI-powered financial assistant</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground">3. Subscription Plans</h2>
            <p className="text-muted-foreground">
              <strong>Free Plan:</strong> Access to 4 basic calculators at no cost.<br/>
              <strong>Premium Monthly:</strong> R299/month with full access to all features. Cancel anytime.<br/>
              <strong>Premium Annual:</strong> R1,499/year (one-time payment) with full access. 7-day refund policy applies.
            </p>

            <h2 className="text-xl font-semibold text-foreground">4. User Responsibilities</h2>
            <p className="text-muted-foreground">
              You are responsible for:
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-2">
              <li>Providing accurate information when using our calculators</li>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring your use complies with applicable South African laws</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground">5. Financial Disclaimer</h2>
            <p className="text-muted-foreground">
              <strong>AdvisoryPro is NOT a registered financial advisor.</strong> The tools and content provided are for informational and educational purposes only. They do not constitute financial, investment, tax, or legal advice. Always consult with a qualified professional financial advisor before making financial decisions.
            </p>

            <h2 className="text-xl font-semibold text-foreground">6. Accuracy of Information</h2>
            <p className="text-muted-foreground">
              While we strive to provide accurate calculations based on current SARS tax tables and financial formulas, we cannot guarantee the accuracy of all results. Tax laws and regulations change, and individual circumstances vary. Users should verify calculations with official sources or professionals.
            </p>

            <h2 className="text-xl font-semibold text-foreground">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              AdvisoryPro, its owners, and affiliates shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of the service, reliance on calculations, or any decisions made based on information provided through our platform.
            </p>

            <h2 className="text-xl font-semibold text-foreground">8. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content, features, and functionality of AdvisoryPro are owned by us and protected by South African and international copyright, trademark, and other intellectual property laws.
            </p>

            <h2 className="text-xl font-semibold text-foreground">9. Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to terminate or suspend your account and access to our services at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
            </p>

            <h2 className="text-xl font-semibold text-foreground">10. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the platform. Continued use of the service after changes constitutes acceptance of the new terms.
            </p>

            <h2 className="text-xl font-semibold text-foreground">11. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms shall be governed by and construed in accordance with the laws of the Republic of South Africa. Any disputes shall be subject to the exclusive jurisdiction of the South African courts.
            </p>

            <h2 className="text-xl font-semibold text-foreground">12. Contact Information</h2>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, please contact us at:<br/>
              <strong>Email:</strong> support@advisorypro.co.za<br/>
              <strong>Website:</strong> advisorypro.co.za
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
