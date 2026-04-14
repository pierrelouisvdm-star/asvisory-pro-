import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ArrowLeft, AlertCircle, Check, Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

// Auto-detect API URL
const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
  ? window.location.origin 
  : process.env.REACT_APP_BACKEND_URL;

export const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Pre-fill reset code if passed from previous page
  const [resetCode, setResetCode] = useState(location.state?.resetCode || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetCode,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }

      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
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
              {success ? 'Password Reset!' : 'Reset Your Password'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {success
                ? 'Your password has been successfully reset'
                : 'Enter your reset code and new password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-code">Reset Code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-code"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="pl-10 text-center tracking-widest font-mono"
                      maxLength={6}
                      required
                      data-testid="reset-code-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      minLength={6}
                      required
                      data-testid="new-password-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      minLength={6}
                      required
                      data-testid="confirm-password-input"
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
                  data-testid="reset-password-btn"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>

                <Link
                  to="/request-password-reset"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Request new code
                </Link>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="h-8 w-8 text-emerald-500" />
                  </div>
                </div>

                <p className="text-center text-muted-foreground">
                  You can now sign in with your new password.
                </p>

                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  data-testid="go-to-login-btn"
                >
                  Go to Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
