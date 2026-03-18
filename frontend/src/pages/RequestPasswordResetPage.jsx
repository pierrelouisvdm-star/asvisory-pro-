import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, AlertCircle, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const RequestPasswordResetPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetCode, setResetCode] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong');
      }

      setSubmitted(true);
      // For testing, the API returns the reset code
      if (data.reset_code) {
        setResetCode(data.reset_code);
      }
      toast.success('If an account exists, a reset code has been generated.');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToReset = () => {
    navigate('/reset-password', { state: { email, resetCode } });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <span className="text-primary-foreground font-bold text-xl">A</span>
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-foreground">
              Financial Advisory Pro
            </span>
          </div>
        </div>

        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-xl text-foreground">
              {submitted ? 'Check Your Email' : 'Forgot Password?'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {submitted
                ? 'We\'ve generated a reset code for your account'
                : 'Enter your email address and we\'ll send you a reset code'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="advisor@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="reset-email-input"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  disabled={isLoading}
                  data-testid="request-reset-btn"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </Button>

                <Link
                  to="/auth"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="back-to-login-link"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="h-8 w-8 text-emerald-500" />
                  </div>
                </div>

                {resetCode && (
                  <div className="p-4 rounded-lg bg-muted border border-border">
                    <p className="text-sm text-muted-foreground text-center mb-2">
                      Your reset code (for testing):
                    </p>
                    <p className="text-2xl font-mono font-bold text-center text-foreground tracking-widest" data-testid="reset-code-display">
                      {resetCode}
                    </p>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Expires in 15 minutes
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleContinueToReset}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  data-testid="continue-to-reset-btn"
                >
                  Continue to Reset Password
                </Button>

                <Link
                  to="/auth"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RequestPasswordResetPage;
