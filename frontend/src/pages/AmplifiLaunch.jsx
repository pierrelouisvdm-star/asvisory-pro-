import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, RotateCcw, LogIn } from 'lucide-react';

const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? window.location.origin
  : process.env.REACT_APP_BACKEND_URL;

// Handles the redirect target of GET /api/amplifi/v1/auth/launch.
// Success  → we get ?token=<advisorypro-jwt>. We store it, fetch /auth/me
//            to hydrate the user object, then hand off to /dashboard.
// Failure  → we get ?error=<code> and render a friendly full-page message.
const ERROR_COPY = {
  expired: {
    title: 'Your Amplifi session expired',
    body: 'Please relaunch AdvisoryPro from inside the Amplifi module. Sessions time out for security.',
    icon: RotateCcw,
  },
  not_found: {
    title: 'No matching AdvisoryPro account',
    body: "We couldn't find an AdvisoryPro account for the email that Amplifi sent us. Ask your admin to re-activate the AdvisoryPro module in Amplifi.",
    icon: ShieldAlert,
  },
  deactivated: {
    title: 'Access has been deactivated',
    body: "Your AdvisoryPro access is currently deactivated. To reactivate, sign in natively or contact support.",
    icon: ShieldAlert,
  },
  invalid_token: {
    title: 'Launch link is not valid',
    body: 'The launch link is missing required information. Please relaunch from Amplifi.',
    icon: ShieldAlert,
  },
  not_configured: {
    title: 'Integration not configured',
    body: 'The Amplifi integration is not fully configured on this server. Contact support.',
    icon: ShieldAlert,
  },
};

export const AmplifiLaunch = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const errorCode = params.get('error');
  const [state, setState] = useState(errorCode ? 'error' : token ? 'loading' : 'error');

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        localStorage.setItem('advisorypro_token', token);
        const { data } = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        localStorage.setItem('advisorypro_user', JSON.stringify(data));
        // Hard nav so AuthContext re-reads localStorage cleanly. Root path
        // (`/`) is where the Dashboard lives — an authenticated user visiting
        // `/` gets the Dashboard component.
        window.location.assign('/');
      } catch (e) {
        localStorage.removeItem('advisorypro_token');
        localStorage.removeItem('advisorypro_user');
        setState('error');
      }
    })();
  }, [token]);

  if (state === 'loading') {
    return (
      <div
        className="min-h-screen bg-navy-950 flex items-center justify-center p-6"
        data-testid="amplifi-launch-loading"
      >
        <div className="text-center">
          <Loader2 className="h-10 w-10 mx-auto text-emerald-400 animate-spin" />
          <p className="mt-4 text-slate-300">Signing you in from Amplifi…</p>
        </div>
      </div>
    );
  }

  const info = ERROR_COPY[errorCode] || ERROR_COPY.invalid_token;
  const Icon = info.icon;

  return (
    <div
      className="min-h-screen bg-navy-950 flex items-center justify-center p-6"
      data-testid="amplifi-launch-error"
      data-error-code={errorCode || 'unknown'}
    >
      <Card className="max-w-lg w-full bg-navy-900/60 border-red-500/30">
        <CardContent className="p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
            <Icon className="h-7 w-7 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{info.title}</h1>
          <p className="text-slate-400 mb-6">{info.body}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              variant="outline"
              className="border-navy-600 text-slate-300 hover:bg-navy-800"
              onClick={() => navigate('/auth')}
              data-testid="amplifi-launch-signin-btn"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign in natively
            </Button>
            <Link to="/">
              <Button variant="ghost" className="text-slate-400 hover:text-white">
                Go home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AmplifiLaunch;
