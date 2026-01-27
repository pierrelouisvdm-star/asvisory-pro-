import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { clientsApi } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Calendar,
  Save,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Shield,
  PiggyBank,
  Wallet,
  CreditCard,
  GraduationCap,
  ScrollText,
  RefreshCw,
  FileText,
  Target,
  CalendarCheck,
  PieChart,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { reportsApi } from '@/services/api';

const priorityColors = {
  critical: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  high: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
};

const categoryIcons = {
  life_insurance: Shield,
  disability_insurance: Shield,
  emergency_fund: Wallet,
  retirement: PiggyBank,
  debt: CreditCard,
  budget: Wallet,
  education: GraduationCap,
  estate: ScrollText,
  tax: FileText,
  net_worth: TrendingUp,
};

const ShortfallCard = ({ shortfall, currencySymbol }) => {
  const Icon = categoryIcons[shortfall.category] || AlertTriangle;
  
  return (
    <Card className={cn("border-l-4", priorityColors[shortfall.priority])}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
            shortfall.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/30' :
            shortfall.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30' :
            shortfall.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30' :
            'bg-emerald-100 dark:bg-emerald-900/30'
          )}>
            <Icon className={cn(
              "h-5 w-5",
              shortfall.priority === 'critical' ? 'text-red-600' :
              shortfall.priority === 'high' ? 'text-orange-600' :
              shortfall.priority === 'medium' ? 'text-amber-600' :
              'text-emerald-600'
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                {shortfall.title}
              </h4>
              <Badge variant="outline" className={cn("text-xs", priorityColors[shortfall.priority])}>
                {shortfall.priority}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              {shortfall.description}
            </p>
            
            <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Current</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {currencySymbol}{shortfall.current_value.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Target</p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {currencySymbol}{shortfall.target_value.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Gap</p>
                <p className="font-semibold text-red-600 dark:text-red-400">
                  {currencySymbol}{shortfall.gap.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-3">
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                Recommendation
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {shortfall.recommendation}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Action Items:</p>
              <ul className="space-y-1">
                {shortfall.action_items.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {shortfall.estimated_monthly_cost > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Estimated Monthly Investment: 
                  <span className="font-semibold text-slate-900 dark:text-white ml-1">
                    {currencySymbol}{shortfall.estimated_monthly_cost.toLocaleString()}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ClientProfilePage = () => {
  const { clientId } = useParams();
  const { isAuthenticated } = useAuth();
  const { currentCurrency } = useCurrency();
  const navigate = useNavigate();
  
  const [client, setClient] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [financialData, setFinancialData] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchClient();
  }, [isAuthenticated, clientId, navigate]);

  const fetchClient = async () => {
    try {
      const data = await clientsApi.getById(clientId);
      setClient(data);
      setFinancialData(data.financial_data || {});
      // Auto-fetch analysis if client has financial data
      if (data.financial_data && Object.keys(data.financial_data).some(k => data.financial_data[k] > 0)) {
        fetchAnalysis();
      }
    } catch (error) {
      toast.error('Failed to load client');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const data = await clientsApi.getAnalysis(clientId);
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleSaveFinancialData = async () => {
    setSaving(true);
    try {
      const updated = await clientsApi.updateFinancialData(clientId, financialData);
      setClient(updated);
      toast.success('Financial data saved');
      // Refresh analysis after saving
      fetchAnalysis();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const data = await clientsApi.refreshAnalysis(clientId);
      setAnalysis(data);
      toast.success('Analysis refreshed');
    } catch (error) {
      toast.error('Failed to refresh analysis');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const updateFinancialField = (field, value) => {
    setFinancialData({
      ...financialData,
      [field]: parseFloat(value) || 0
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading client...</div>
      </div>
    );
  }

  if (!client) return null;

  const currencySymbol = currentCurrency.symbol;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950" data-testid="client-profile-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/clients" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Clients
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-2xl">
              {client.first_name[0]}{client.last_name[0]}
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {client.first_name} {client.last_name}
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                {client.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {client.email}
                  </span>
                )}
                {client.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-5 gap-3">
          <Link to={`/clients/${clientId}/goals`}>
            <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1" data-testid="goals-link">
              <Target className="h-5 w-5 text-emerald-600" />
              <span className="text-xs">Goals</span>
            </Button>
          </Link>
          <Link to={`/clients/${clientId}/meetings`}>
            <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1" data-testid="meetings-link">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-xs">Meetings</span>
            </Button>
          </Link>
          <Link to={`/clients/${clientId}/reviews`}>
            <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1" data-testid="reviews-link">
              <CalendarCheck className="h-5 w-5 text-purple-600" />
              <span className="text-xs">Reviews</span>
            </Button>
          </Link>
          <Link to={`/clients/${clientId}/portfolio`}>
            <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1" data-testid="portfolio-link">
              <PieChart className="h-5 w-5 text-amber-600" />
              <span className="text-xs">Portfolio</span>
            </Button>
          </Link>
          <a 
            href={reportsApi.downloadAnalysis(clientId, currentCurrency.code)} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1" data-testid="download-report-link">
              <Download className="h-5 w-5 text-slate-600" />
              <span className="text-xs">Report</span>
            </Button>
          </a>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList>
            <TabsTrigger value="analysis" data-testid="analysis-tab">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Plan Analysis
            </TabsTrigger>
            <TabsTrigger value="financial-data" data-testid="financial-data-tab">
              <TrendingUp className="h-4 w-4 mr-2" />
              Financial Data
            </TabsTrigger>
            <TabsTrigger value="profile" data-testid="profile-tab">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Analysis Tab */}
          <TabsContent value="analysis">
            {analysis ? (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className={cn(
                          "inline-flex h-16 w-16 items-center justify-center rounded-full mb-3",
                          analysis.health_rating === 'Excellent' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                          analysis.health_rating === 'Good' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                          analysis.health_rating === 'Fair' ? 'bg-amber-100 dark:bg-amber-900/30' :
                          'bg-red-100 dark:bg-red-900/30'
                        )}>
                          <span className={cn(
                            "text-2xl font-bold",
                            analysis.health_rating === 'Excellent' ? 'text-emerald-600' :
                            analysis.health_rating === 'Good' ? 'text-emerald-600' :
                            analysis.health_rating === 'Fair' ? 'text-amber-600' :
                            'text-red-600'
                          )}>
                            {Math.round(analysis.overall_score)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Health Score</p>
                        <Badge className={cn(
                          "mt-1",
                          analysis.health_rating === 'Excellent' ? 'bg-emerald-100 text-emerald-700' :
                          analysis.health_rating === 'Good' ? 'bg-emerald-100 text-emerald-700' :
                          analysis.health_rating === 'Fair' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        )}>
                          {analysis.health_rating}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {analysis.total_shortfalls}
                          </p>
                          <p className="text-sm text-slate-500">Shortfalls Found</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
                          <TrendingUp className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {currencySymbol}{(analysis.total_gap_amount / 1000000).toFixed(1)}M
                          </p>
                          <p className="text-sm text-slate-500">Total Gap</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                          <Wallet className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {currencySymbol}{analysis.estimated_monthly_investment_needed.toLocaleString()}
                          </p>
                          <p className="text-sm text-slate-500">Monthly Need</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Refresh Button */}
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={handleRefreshAnalysis}
                    disabled={analysisLoading}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", analysisLoading && "animate-spin")} />
                    Refresh Analysis
                  </Button>
                </div>

                {/* Shortfalls by Priority */}
                {analysis.critical_shortfalls.length > 0 && (
                  <div>
                    <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Critical Priority ({analysis.critical_shortfalls.length})
                    </h3>
                    <div className="grid gap-4">
                      {analysis.critical_shortfalls.map((shortfall, idx) => (
                        <ShortfallCard key={idx} shortfall={shortfall} currencySymbol={currencySymbol} />
                      ))}
                    </div>
                  </div>
                )}

                {analysis.high_priority_shortfalls.length > 0 && (
                  <div>
                    <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      High Priority ({analysis.high_priority_shortfalls.length})
                    </h3>
                    <div className="grid gap-4">
                      {analysis.high_priority_shortfalls.map((shortfall, idx) => (
                        <ShortfallCard key={idx} shortfall={shortfall} currencySymbol={currencySymbol} />
                      ))}
                    </div>
                  </div>
                )}

                {analysis.medium_priority_shortfalls.length > 0 && (
                  <div>
                    <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      Medium Priority ({analysis.medium_priority_shortfalls.length})
                    </h3>
                    <div className="grid gap-4">
                      {analysis.medium_priority_shortfalls.map((shortfall, idx) => (
                        <ShortfallCard key={idx} shortfall={shortfall} currencySymbol={currencySymbol} />
                      ))}
                    </div>
                  </div>
                )}

                {analysis.low_priority_shortfalls.length > 0 && (
                  <div>
                    <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      Low Priority ({analysis.low_priority_shortfalls.length})
                    </h3>
                    <div className="grid gap-4">
                      {analysis.low_priority_shortfalls.map((shortfall, idx) => (
                        <ShortfallCard key={idx} shortfall={shortfall} currencySymbol={currencySymbol} />
                      ))}
                    </div>
                  </div>
                )}

                {analysis.total_shortfalls === 0 && (
                  <Card className="text-center py-12">
                    <CardContent>
                      <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
                      <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        No Shortfalls Identified
                      </h3>
                      <p className="text-slate-500">
                        This client&apos;s financial plan appears to be well-structured.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <AlertTriangle className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No Analysis Available
                  </h3>
                  <p className="text-slate-500 mb-4">
                    Add financial data to generate a shortfall analysis.
                  </p>
                  <Button onClick={() => document.querySelector('[data-testid="financial-data-tab"]')?.click()}>
                    Add Financial Data
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Financial Data Tab */}
          <TabsContent value="financial-data">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Income & Budget */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-emerald-600" />
                    Income & Budget
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Monthly Income</Label>
                      <Input
                        type="number"
                        value={financialData.monthly_income || ''}
                        onChange={(e) => updateFinancialField('monthly_income', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Monthly Expenses</Label>
                      <Input
                        type="number"
                        value={financialData.monthly_expenses || ''}
                        onChange={(e) => updateFinancialField('monthly_expenses', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Annual Income</Label>
                    <Input
                      type="number"
                      value={financialData.annual_income || ''}
                      onChange={(e) => updateFinancialField('annual_income', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Assets */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Assets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Total Assets</Label>
                      <Input
                        type="number"
                        value={financialData.total_assets || ''}
                        onChange={(e) => updateFinancialField('total_assets', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Liquid Assets</Label>
                      <Input
                        type="number"
                        value={financialData.liquid_assets || ''}
                        onChange={(e) => updateFinancialField('liquid_assets', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Investments</Label>
                      <Input
                        type="number"
                        value={financialData.investments || ''}
                        onChange={(e) => updateFinancialField('investments', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Property Value</Label>
                      <Input
                        type="number"
                        value={financialData.property_value || ''}
                        onChange={(e) => updateFinancialField('property_value', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liabilities */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-red-600" />
                    Liabilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Total Liabilities</Label>
                      <Input
                        type="number"
                        value={financialData.total_liabilities || ''}
                        onChange={(e) => updateFinancialField('total_liabilities', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Mortgage Balance</Label>
                      <Input
                        type="number"
                        value={financialData.mortgage_balance || ''}
                        onChange={(e) => updateFinancialField('mortgage_balance', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Other Debt</Label>
                    <Input
                      type="number"
                      value={financialData.other_debt || ''}
                      onChange={(e) => updateFinancialField('other_debt', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Insurance */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    Insurance Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Life Insurance Coverage</Label>
                      <Input
                        type="number"
                        value={financialData.life_insurance_coverage || ''}
                        onChange={(e) => updateFinancialField('life_insurance_coverage', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Life Insurance Needed</Label>
                      <Input
                        type="number"
                        value={financialData.life_insurance_needed || ''}
                        onChange={(e) => updateFinancialField('life_insurance_needed', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Disability Coverage (Monthly)</Label>
                    <Input
                      type="number"
                      value={financialData.disability_coverage || ''}
                      onChange={(e) => updateFinancialField('disability_coverage', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Fund */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-amber-600" />
                    Emergency Fund
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Current Emergency Fund</Label>
                      <Input
                        type="number"
                        value={financialData.emergency_fund_current || ''}
                        onChange={(e) => updateFinancialField('emergency_fund_current', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Emergency Fund Needed</Label>
                      <Input
                        type="number"
                        value={financialData.emergency_fund_needed || ''}
                        onChange={(e) => updateFinancialField('emergency_fund_needed', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Retirement */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-emerald-600" />
                    Retirement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Current Retirement Savings</Label>
                      <Input
                        type="number"
                        value={financialData.retirement_savings || ''}
                        onChange={(e) => updateFinancialField('retirement_savings', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Retirement Goal</Label>
                      <Input
                        type="number"
                        value={financialData.retirement_goal || ''}
                        onChange={(e) => updateFinancialField('retirement_goal', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Years to Retirement</Label>
                    <Input
                      type="number"
                      value={financialData.years_to_retirement || ''}
                      onChange={(e) => updateFinancialField('years_to_retirement', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Education */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-emerald-600" />
                    Education Savings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Current Education Savings</Label>
                      <Input
                        type="number"
                        value={financialData.education_savings_current || ''}
                        onChange={(e) => updateFinancialField('education_savings_current', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Education Savings Needed</Label>
                      <Input
                        type="number"
                        value={financialData.education_savings_needed || ''}
                        onChange={(e) => updateFinancialField('education_savings_needed', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Estate */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <ScrollText className="h-5 w-5 text-emerald-600" />
                    Estate Planning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Estate Value</Label>
                      <Input
                        type="number"
                        value={financialData.estate_value || ''}
                        onChange={(e) => updateFinancialField('estate_value', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Estimated Estate Duty</Label>
                      <Input
                        type="number"
                        value={financialData.estate_duty_estimated || ''}
                        onChange={(e) => updateFinancialField('estate_duty_estimated', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={handleSaveFinancialData} disabled={saving} data-testid="save-financial-data-btn">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Financial Data'}
              </Button>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Client Information</CardTitle>
                <CardDescription>Basic contact and profile details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Full Name</p>
                        <p className="font-medium">{client.first_name} {client.last_name}</p>
                      </div>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-500">Email</p>
                          <p className="font-medium">{client.email}</p>
                        </div>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-500">Phone</p>
                          <p className="font-medium">{client.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {client.occupation && (
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-500">Occupation</p>
                          <p className="font-medium">{client.occupation}</p>
                        </div>
                      </div>
                    )}
                    {client.date_of_birth && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-500">Date of Birth</p>
                          <p className="font-medium">{client.date_of_birth}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {client.notes && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-slate-500 mb-2">Notes</p>
                    <p className="text-slate-700 dark:text-slate-300">{client.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
