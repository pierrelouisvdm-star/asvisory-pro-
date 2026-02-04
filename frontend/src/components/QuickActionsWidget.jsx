import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, Users, Calculator, CalendarCheck, ChevronRight, 
  TrendingUp, AlertCircle, Sparkles, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Calculator type to label mapping
const calcTypeLabels = {
  'future_value': 'Future Value',
  'compound_interest': 'Compound Interest',
  'bond': 'Bond Calculator',
  'car_finance': 'Vehicle Finance',
  'life_insurance': 'Life Insurance',
  'income_disability': 'Income Protection',
  'retirement': 'Retirement',
  'living_annuity': 'Living Annuity',
  'tax': 'Tax Calculator',
  'budget': 'Budget Planner',
  'net_worth': 'Net Worth',
  'debt_payoff': 'Debt Payoff',
  'emergency_fund': 'Emergency Fund',
  'estate_planning': 'Estate Planning',
  'education_savings': 'Education Savings',
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  } catch {
    return dateStr;
  }
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
};

export const QuickActionsWidget = () => {
  const { isAuthenticated, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuickActions = async () => {
      if (!isAuthenticated || !token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/analytics/quick-actions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching quick actions:', err);
        setError('Unable to load quick actions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuickActions();
  }, [isAuthenticated, token]);

  // Don't show widget if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <Card className="bg-navy-900/60 border-navy-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-navy-700 rounded w-1/3"></div>
            <div className="h-20 bg-navy-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const hasActivity = data.recent_calculations?.length > 0 || data.upcoming_reviews?.length > 0;

  return (
    <Card className="bg-gradient-to-br from-navy-900/80 to-navy-900/40 border-navy-700 overflow-hidden" data-testid="quick-actions-widget">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            Quick Actions
          </CardTitle>
          <Link to="/clients">
            <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-navy-800/50 rounded-lg p-3 border border-navy-700">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Users className="h-3.5 w-3.5" />
              Total Clients
            </div>
            <p className="text-2xl font-bold text-white">{data.total_clients || 0}</p>
          </div>
          <div className="bg-navy-800/50 rounded-lg p-3 border border-navy-700">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Calculator className="h-3.5 w-3.5" />
              This Month
            </div>
            <p className="text-2xl font-bold text-white">{data.calculations_this_month || 0}</p>
          </div>
        </div>

        {!hasActivity ? (
          /* Empty State */
          <div className="text-center py-6 px-4 bg-navy-800/30 rounded-lg border border-dashed border-navy-600">
            <TrendingUp className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-3">No recent activity yet</p>
            <Link to="/clients">
              <Button size="sm" className="btn-premium">
                Add Your First Client
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Recent Calculations */}
            {data.recent_calculations?.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  Recent Calculations
                </h4>
                <div className="space-y-2">
                  {data.recent_calculations.slice(0, 3).map((calc) => (
                    <Link 
                      key={calc.id} 
                      to={`/clients/${calc.client_id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-navy-800/40 hover:bg-navy-800/70 border border-navy-700/50 transition-colors group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                            <Calculator className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
                              {calc.client_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {calcTypeLabels[calc.calculator_type] || calc.calculator_type}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                          {formatTimeAgo(calc.created_at)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Reviews */}
            {data.upcoming_reviews?.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <CalendarCheck className="h-3.5 w-3.5" />
                  Upcoming Reviews
                </h4>
                <div className="space-y-2">
                  {data.upcoming_reviews.slice(0, 3).map((review) => (
                    <Link 
                      key={review.client_id} 
                      to={`/clients/${review.client_id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-navy-800/40 hover:bg-navy-800/70 border border-navy-700/50 transition-colors group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
                            review.days_until <= 3 
                              ? 'bg-amber-500/20 text-amber-400' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            <CalendarCheck className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
                              {review.client_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDate(review.next_review_date)}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs flex-shrink-0 ml-2 ${
                            review.days_until <= 3 
                              ? 'border-amber-500/50 text-amber-400' 
                              : 'border-slate-600 text-slate-400'
                          }`}
                        >
                          {review.days_until === 0 ? 'Today' : 
                           review.days_until === 1 ? 'Tomorrow' : 
                           `${review.days_until} days`}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickActionsWidget;
