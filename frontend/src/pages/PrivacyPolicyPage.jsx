import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const PrivacyPolicyPage = () => {
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
            <Shield className="h-3 w-3 mr-1" />
            Privacy
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: April 2026</p>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-8 prose prose-invert max-w-none">
            <h2 className="text-xl font-semibold text-foreground mt-0">1. Introduction</h2>
            <p className="text-muted-foreground">
              AdvisoryPro ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our financial planning platform at advisorypro.co.za.
            </p>

            <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
            <p className="text-muted-foreground">
              <strong>Account Information:</strong>
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-2">
              <li>Name and email address</li>
              <li>Password (encrypted)</li>
              <li>Company name (optional)</li>
            </ul>
            <p className="text-muted-foreground">
              <strong>Financial Data You Enter:</strong>
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-2">
              <li>Income and expense information</li>
              <li>Investment values and projections</li>
              <li>Tax-related information</li>
              <li>Receipt images (for expense tracking)</li>
              <li>Net worth components</li>
            </ul>
            <p className="text-muted-foreground">
              <strong>Technical Data:</strong>
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-2">
              <li>IP address and browser type</li>
              <li>Device information</li>
              <li>Usage patterns and feature interactions</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use your information to:
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-2">
              <li>Provide and maintain our financial calculation services</li>
              <li>Process your subscription payments</li>
              <li>Send you important service updates and notifications</li>
              <li>Improve our calculators and user experience</li>
              <li>Respond to your support requests</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground">4. Data Storage and Security</h2>
            <p className="text-muted-foreground">
              Your data is stored securely using:
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-2">
              <li>Encrypted databases (MongoDB Atlas)</li>
              <li>HTTPS encryption for all data transmission</li>
              <li>Secure password hashing (bcrypt)</li>
              <li>Regular security audits and updates</li>
            </ul>
            <p className="text-muted-foreground">
              Your financial data is stored only to provide you with our services and is never sold to third parties.
            </p>

            <h2 className="text-xl font-semibold text-foreground">5. Data Sharing</h2>
            <p className="text-muted-foreground">
              We do NOT sell your personal data. We may share data with:
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-2">
              <li><strong>Payment Processors:</strong> PayFast/Paystack for secure payment processing</li>
              <li><strong>AI Services:</strong> OpenAI for AI assistant features (anonymized queries only)</li>
              <li><strong>Legal Requirements:</strong> When required by South African law or court order</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground">6. Your Rights (POPIA Compliance)</h2>
            <p className="text-muted-foreground">
              Under the Protection of Personal Information Act (POPIA), you have the right to:
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability (export your data)</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground">7. Cookies and Tracking</h2>
            <p className="text-muted-foreground">
              We use essential cookies to:
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-2">
              <li>Keep you logged in</li>
              <li>Remember your preferences (currency, theme)</li>
              <li>Ensure security of your session</li>
            </ul>
            <p className="text-muted-foreground">
              We do not use advertising or tracking cookies.
            </p>

            <h2 className="text-xl font-semibold text-foreground">8. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your data for as long as your account is active. Upon account deletion:
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-2">
              <li>Personal data is deleted within 30 days</li>
              <li>Financial records may be retained for 5 years for legal compliance</li>
              <li>Anonymized usage data may be retained for analytics</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground">9. Children's Privacy</h2>
            <p className="text-muted-foreground">
              AdvisoryPro is not intended for users under 18 years of age. We do not knowingly collect information from children.
            </p>

            <h2 className="text-xl font-semibold text-foreground">10. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this privacy policy from time to time. We will notify you of significant changes via email or through the platform.
            </p>

            <h2 className="text-xl font-semibold text-foreground">11. Contact Us</h2>
            <p className="text-muted-foreground">
              For privacy-related inquiries or to exercise your rights:<br/>
              <strong>Email:</strong> privacy@advisorypro.co.za<br/>
              <strong>Website:</strong> advisorypro.co.za
            </p>

            <h2 className="text-xl font-semibold text-foreground">12. Information Officer</h2>
            <p className="text-muted-foreground">
              In compliance with POPIA, our Information Officer can be contacted at:<br/>
              <strong>Email:</strong> info@advisorypro.co.za
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
