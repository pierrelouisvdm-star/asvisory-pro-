import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, UserPlus, Activity, TrendingUp, Calendar,
  RefreshCw, Building2, Mail, Clock
} from 'lucide-react';
import { analyticsApi } from '@/services/api';
import { toast } from 'sonner';

const StatCard = ({ title, value, icon: Icon, subtitle, trend }) => (
  <Card className="bg-navy-900/60 border-navy-700">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <Icon className="h-6 w-6 text-emerald-400" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-sm">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <span className="text-emerald-400">{trend}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

const ActivityChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => Math.max(d.registrations, d.logins)), 1);
  
  return (
    <Card className="bg-navy-900/60 border-navy-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          User Activity (Last 7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((day, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{new Date(day.date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric' })}</span>
                <div className="flex gap-4">
                  <span className="text-emerald-400">{day.registrations} new</span>
                  <span className="text-blue-400">{day.logins} logins</span>
                </div>
              </div>
              <div className="flex gap-2 h-6">
                <div 
                  className="bg-emerald-500/30 rounded-full transition-all"
                  style={{ width: `${(day.registrations / maxValue) * 50}%`, minWidth: day.registrations > 0 ? '20px' : '4px' }}
                />
                <div 
                  className="bg-blue-500/30 rounded-full transition-all"
                  style={{ width: `${(day.logins / maxValue) * 50}%`, minWidth: day.logins > 0 ? '20px' : '4px' }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500/30" />
            <span className="text-slate-400">New Registrations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500/30" />
            <span className="text-slate-400">Logins</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const result = await analyticsApi.getDashboard();
      setData(result);
    } catch (error) {
      toast.error('Failed to load analytics');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950" data-testid="analytics-dashboard">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Badge className="mb-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              Admin
            </Badge>
            <h1 className="font-display text-3xl font-extrabold text-white">
              User Analytics
            </h1>
            <p className="text-slate-400 mt-1">
              Track user registrations and activity
            </p>
          </div>
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-navy-800 hover:bg-navy-700 text-white border border-navy-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Users" 
            value={data?.stats?.total_users || 0}
            icon={Users}
            subtitle="All time"
          />
          <StatCard 
            title="New Today" 
            value={data?.stats?.new_users_today || 0}
            icon={UserPlus}
            subtitle="Registrations"
          />
          <StatCard 
            title="This Week" 
            value={data?.stats?.new_users_week || 0}
            icon={Calendar}
            subtitle="New users"
          />
          <StatCard 
            title="Active Users" 
            value={data?.stats?.active_users_week || 0}
            icon={Activity}
            subtitle="Last 7 days"
          />
        </div>

        {/* Activity Chart */}
        <div className="mb-8">
          <ActivityChart data={data?.activity} />
        </div>

        {/* Recent Users Table */}
        <Card className="bg-navy-900/60 border-navy-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              Recent Users ({data?.recent_users?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-navy-700 hover:bg-navy-800/50">
                    <TableHead className="text-slate-400">User</TableHead>
                    <TableHead className="text-slate-400">Company</TableHead>
                    <TableHead className="text-slate-400">Registered</TableHead>
                    <TableHead className="text-slate-400">Last Login</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.recent_users?.map((user, index) => (
                    <TableRow key={user.id || index} className="border-navy-700 hover:bg-navy-800/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <span className="text-emerald-400 font-semibold">
                              {(user.full_name || user.email || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.full_name || 'Unknown'}</p>
                            <p className="text-slate-400 text-sm flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Building2 className="h-4 w-4 text-slate-500" />
                          {user.company || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          {formatDate(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock className="h-4 w-4 text-slate-500" />
                          {formatDate(user.last_login)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={user.is_active 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!data?.recent_users || data.recent_users.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
