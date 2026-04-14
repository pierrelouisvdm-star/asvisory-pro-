import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, Calculator, ChevronRight, 
  TrendingUp, Sparkles, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

// Auto-detect API URL
const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
  ? window.location.origin 
  : process.env.REACT_APP_BACKEND_URL;

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
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
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
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const hasActivity = data.recent_calculations?.length > 0;

  return (
    <Card className="bg-gradient-to-br from-card to-muted/30 border-border overflow-hidden" data-testid="quick-actions-widget">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Activity
          </CardTitle>
          <Link to="/analytics">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Calculator className="h-3.5 w-3.5" />
              Total Calculations
            </div>
            <p className="text-2xl font-bold text-foreground">{data.calculations_this_month || 0}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              This Month
            </div>
            <p className="text-2xl font-bold text-foreground">{data.calculations_this_month || 0}</p>
          </div>
        </div>

        {!hasActivity ? (
          /* Empty State */
          <div className="text-center py-6 px-4 bg-muted/30 rounded-lg border border-dashed border-border">
            <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-3">No recent activity yet</p>
            <Link to="/future-value">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Try a Calculator
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Recent Calculations */}
            {data.recent_calculations?.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  Recent Calculations
                </h4>
                <div className="space-y-2">
                  {data.recent_calculations.slice(0, 3).map((calc, index) => (
                    <div 
                      key={calc.id || index}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                          <Calculator className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {calcTypeLabels[calc.calculator_type] || calc.calculator_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(calc.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
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
