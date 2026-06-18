import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Compass, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage = () => (
  <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6" data-testid="not-found-page">
    <div className="max-w-lg w-full text-center">
      <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
        <Compass className="h-10 w-10 text-emerald-400" />
      </div>
      <p className="text-emerald-400 text-sm font-medium uppercase tracking-wider mb-3">404 · Page not found</p>
      <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Lost in the markets?</h1>
      <p className="text-slate-400 mb-8">
        The page you're looking for doesn't exist or has moved. Let's get you back on track.
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link to="/">
          <Button className="bg-emerald-500 hover:bg-emerald-400 text-navy-950" data-testid="not-found-home-btn">
            <Home className="h-4 w-4 mr-2" />
            Back to home
          </Button>
        </Link>
        <Link to="/pricing">
          <Button variant="outline" className="border-navy-600 text-slate-300 hover:bg-navy-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            See pricing
          </Button>
        </Link>
      </div>
    </div>
  </div>
);

export default NotFoundPage;
