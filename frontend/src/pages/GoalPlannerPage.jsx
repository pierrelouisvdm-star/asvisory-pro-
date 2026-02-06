import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { goalsApi, clientsApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Target, Plus, Home, Car, Plane, GraduationCap, PiggyBank, 
  Briefcase, Heart, Sparkles, ArrowLeft, Trash2, Edit,
  TrendingUp, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const categoryIcons = {
  house: Home,
  car: Car,
  vacation: Plane,
  education: GraduationCap,
  retirement: PiggyBank,
  emergency: Target,
  wedding: Heart,
  business: Briefcase,
  other: Sparkles,
};

const categoryColors = {
  house: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  car: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  vacation: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
  education: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  retirement: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  emergency: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  wedding: 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
  business: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  other: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
};

const statusColors = {
  not_started: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  on_track: 'bg-emerald-100 text-emerald-700',
  behind: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
};

export const GoalPlannerPage = () => {
  const { clientId } = useParams();
  const { isAuthenticated } = useAuth();
  const { currentCurrency } = useCurrency();
  const [client, setClient] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newGoal, setNewGoal] = useState({
    name: '',
    category: 'other',
    target_amount: '',
    current_amount: '',
    monthly_contribution: '',
    expected_return: '8',
    target_date: '',
    priority: 1,
    notes: '',
  });

  useEffect(() => {
    if (isAuthenticated && clientId) {
      fetchData();
    }
  }, [isAuthenticated, clientId]);

  const fetchData = async () => {
    try {
      const [clientData, goalsData] = await Promise.all([
        clientsApi.getById(clientId),
        goalsApi.getByClient(clientId),
      ]);
      setClient(clientData);
      setGoals(goalsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const goalData = {
        ...newGoal,
        client_id: clientId,
        target_amount: parseFloat(newGoal.target_amount) || 0,
        current_amount: parseFloat(newGoal.current_amount) || 0,
        monthly_contribution: parseFloat(newGoal.monthly_contribution) || 0,
        expected_return: parseFloat(newGoal.expected_return) || 8,
        priority: parseInt(newGoal.priority) || 1,
      };
      const created = await goalsApi.create(goalData);
      setGoals([...goals, created]);
      setNewGoal({
        name: '',
        category: 'other',
        target_amount: '',
        current_amount: '',
        monthly_contribution: '',
        expected_return: '8',
        target_date: '',
        priority: 1,
        notes: '',
      });
      setIsAddOpen(false);
      toast.success('Goal created!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await goalsApi.delete(goalId);
      setGoals(goals.filter(g => g.id !== goalId));
      toast.success('Goal deleted');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const calculateProgress = (goal) => {
    if (!goal.target_amount) return 0;
    return Math.min(100, (goal.current_amount / goal.target_amount) * 100);
  };

  const calculateMonthsToGoal = (goal) => {
    const remaining = goal.target_amount - goal.current_amount;
    if (remaining <= 0 || !goal.monthly_contribution) return 0;
    return Math.ceil(remaining / goal.monthly_contribution);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const currencySymbol = currentCurrency.symbol;
  const totalTargetAmount = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalCurrentAmount = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  return (
    <div className="min-h-screen bg-navy-950" data-testid="goal-planner-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to={`/clients/${clientId}`} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to {client?.first_name}'s Profile
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Financial Goals
              </h1>
              <p className="text-slate-500 mt-1">
                Track and manage {client?.first_name}'s financial goals
              </p>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="btn-premium" data-testid="add-goal-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Goal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddGoal}>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label>Goal Name *</Label>
                      <Input
                        value={newGoal.name}
                        onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                        placeholder="e.g., House Deposit"
                        required
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select value={newGoal.category} onValueChange={(v) => setNewGoal({...newGoal, category: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="car">Car</SelectItem>
                          <SelectItem value="vacation">Vacation</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="retirement">Retirement</SelectItem>
                          <SelectItem value="emergency">Emergency Fund</SelectItem>
                          <SelectItem value="wedding">Wedding</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Target Amount *</Label>
                        <Input
                          type="number"
                          value={newGoal.target_amount}
                          onChange={(e) => setNewGoal({...newGoal, target_amount: e.target.value})}
                          placeholder="0"
                          required
                        />
                      </div>
                      <div>
                        <Label>Current Amount</Label>
                        <Input
                          type="number"
                          value={newGoal.current_amount}
                          onChange={(e) => setNewGoal({...newGoal, current_amount: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Monthly Contribution</Label>
                        <Input
                          type="number"
                          value={newGoal.monthly_contribution}
                          onChange={(e) => setNewGoal({...newGoal, monthly_contribution: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label>Expected Return (%)</Label>
                        <Input
                          type="number"
                          value={newGoal.expected_return}
                          onChange={(e) => setNewGoal({...newGoal, expected_return: e.target.value})}
                          placeholder="8"
                          step="0.5"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Target Date</Label>
                      <Input
                        type="date"
                        value={newGoal.target_date}
                        onChange={(e) => setNewGoal({...newGoal, target_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Creating...' : 'Create Goal'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                  <Target className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{goals.length}</p>
                  <p className="text-sm text-slate-500">Total Goals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{currencySymbol}{totalCurrentAmount.toLocaleString('en-ZA')}</p>
                  <p className="text-sm text-slate-500">Saved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
                  <Target className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{currencySymbol}{totalTargetAmount.toLocaleString('en-ZA')}</p>
                  <p className="text-sm text-slate-500">Target</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overallProgress.toFixed(0)}%</p>
                  <p className="text-sm text-slate-500">Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Target className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No goals yet</h3>
              <p className="text-slate-500 mb-4">Create your first financial goal to get started</p>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => {
              const Icon = categoryIcons[goal.category] || Target;
              const progress = calculateProgress(goal);
              const monthsLeft = calculateMonthsToGoal(goal);

              return (
                <Card key={goal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", categoryColors[goal.category])}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[goal.status]}>
                          {goal.status?.replace('_', ' ')}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteGoal(goal.id)}>
                          <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="font-display text-lg mt-3">{goal.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-500">Progress</span>
                          <span className="font-semibold">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Current</p>
                          <p className="font-semibold text-lg">{currencySymbol}{goal.current_amount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Target</p>
                          <p className="font-semibold text-lg text-emerald-600">{currencySymbol}{goal.target_amount?.toLocaleString()}</p>
                        </div>
                      </div>

                      {goal.expected_return > 0 && (
                        <div className="flex items-center gap-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                          <span className="text-emerald-700 dark:text-emerald-400">
                            Expected Return: <strong>{goal.expected_return}%</strong> p.a.
                          </span>
                        </div>
                      )}

                      {goal.monthly_contribution > 0 && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 pt-2 border-t">
                          <Calendar className="h-4 w-4" />
                          <span>{currencySymbol}{goal.monthly_contribution}/mo • {monthsLeft} months to go</span>
                        </div>
                      )}

                      {goal.target_date && (
                        <div className="text-sm text-slate-500">
                          Target: {new Date(goal.target_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
