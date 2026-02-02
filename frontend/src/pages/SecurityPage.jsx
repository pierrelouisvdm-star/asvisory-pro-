import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, Lock, Eye, FileText, CheckCircle2, AlertTriangle,
  Clock, Users, Activity, Download, Info, Scale, Key,
  Server, Database, UserCheck, History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const SecurityPage = () => {
  const { user, token } = useAuth();
  const [securitySummary, setSecuritySummary] = useState(null);
  const [privacyReport, setPrivacyReport] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      const [summaryRes, privacyRes, logsRes] = await Promise.all([
        axios.get(`${API}/api/audit/summary`, { headers }),
        axios.get(`${API}/api/audit/privacy-report`, { headers }),
        axios.get(`${API}/api/audit/logs?limit=20`, { headers })
      ]);
      
      setSecuritySummary(summaryRes.data);
      setPrivacyReport(privacyRes.data);
      setAuditLogs(logsRes.data.logs || []);
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-ZA');
  };

  const getActionIcon = (action) => {
    if (action?.includes('login')) return <Key className="h-4 w-4" />;
    if (action?.includes('client')) return <Users className="h-4 w-4" />;
    if (action?.includes('financial')) return <Activity className="h-4 w-4" />;
    return <Eye className="h-4 w-4" />;
  };

  const getActionColor = (action) => {
    if (action?.includes('create')) return 'text-emerald-400';
    if (action?.includes('delete')) return 'text-red-400';
    if (action?.includes('update')) return 'text-amber-400';
    return 'text-blue-400';
  };

  return (
    <div className="space-y-6" data-testid="security-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="h-7 w-7 text-emerald-400" />
            Security & Privacy
          </h1>
          <p className="text-slate-400 mt-1">
            POPIA-compliant data protection for your practice
          </p>
        </div>
        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
          <Lock className="h-3 w-3 mr-1" />
          Protected
        </Badge>
      </div>

      {/* Security Status Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Security Status</p>
                <p className="text-lg font-semibold text-emerald-400">
                  {securitySummary?.security_status === 'secure' ? 'Secure' : 'Review Needed'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-900/60 border-navy-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Clients</p>
                <p className="text-lg font-semibold text-white">
                  {securitySummary?.total_clients || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-900/60 border-navy-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Activity className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Client Access (30d)</p>
                <p className="text-lg font-semibold text-white">
                  {securitySummary?.client_access_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-900/60 border-navy-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Last Login</p>
                <p className="text-sm font-medium text-white">
                  {securitySummary?.last_login ? formatDate(securitySummary.last_login) : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-navy-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500/20">
            <Shield className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-emerald-500/20">
            <History className="h-4 w-4 mr-2" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="privacy" className="data-[state=active]:bg-emerald-500/20">
            <Scale className="h-4 w-4 mr-2" />
            POPIA Compliance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Security Measures */}
          <Card className="bg-navy-900/60 border-navy-700">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-400" />
                Security Measures in Place
              </CardTitle>
              <CardDescription>
                How we protect your clients' data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  {
                    icon: Key,
                    title: 'Password Security',
                    description: 'Passwords are hashed using bcrypt algorithm - never stored in plain text',
                    status: 'Active'
                  },
                  {
                    icon: Lock,
                    title: 'JWT Authentication',
                    description: 'Secure token-based authentication with automatic expiry',
                    status: 'Active'
                  },
                  {
                    icon: UserCheck,
                    title: 'Data Isolation',
                    description: 'Each advisor can only access their own clients - strict separation enforced',
                    status: 'Active'
                  },
                  {
                    icon: History,
                    title: 'Audit Logging',
                    description: 'All data access is logged with timestamps, IP addresses, and actions',
                    status: 'Active'
                  },
                  {
                    icon: Server,
                    title: 'Encryption in Transit',
                    description: 'All data transferred over HTTPS with TLS encryption',
                    status: 'Active'
                  },
                  {
                    icon: Database,
                    title: 'Database Security',
                    description: 'MongoDB with authentication and network isolation',
                    status: 'Active'
                  }
                ].map((measure, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-navy-800/50 rounded-lg">
                    <div className="p-2 bg-emerald-500/20 rounded-lg flex-shrink-0">
                      <measure.icon className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-white">{measure.title}</p>
                        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 text-xs">
                          {measure.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{measure.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Isolation Explanation */}
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-400 mb-1">Data Isolation Guarantee</h4>
                  <p className="text-sm text-slate-300">
                    Your client data is completely isolated from other advisors. Every database query 
                    is filtered by your unique advisor ID, ensuring no other user can access your 
                    clients' information. This is enforced at the API level, not just the UI.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card className="bg-navy-900/60 border-navy-700">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <History className="h-5 w-5 text-emerald-400" />
                Recent Activity Log
              </CardTitle>
              <CardDescription>
                Track all data access and modifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No activity logged yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log, index) => (
                    <div 
                      key={log.id || index}
                      className="flex items-center gap-4 p-3 bg-navy-800/50 rounded-lg"
                    >
                      <div className={`p-2 rounded-lg bg-navy-700 ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white capitalize">
                          {log.action?.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-slate-400">
                          {log.resource_type} {log.resource_id ? `• ID: ${log.resource_id.substring(0, 8)}...` : ''}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-400">
                          {formatDate(log.timestamp)}
                        </p>
                        {log.ip_address && (
                          <p className="text-xs text-slate-500">
                            IP: {log.ip_address}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* POPIA Compliance Tab */}
        <TabsContent value="privacy" className="space-y-6">
          {/* Data Categories */}
          <Card className="bg-navy-900/60 border-navy-700">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                Data Categories Collected
              </CardTitle>
              <CardDescription>
                Types of personal information stored under POPIA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {privacyReport?.data_categories?.map((category, index) => (
                  <div key={index} className="p-4 bg-navy-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{category.category}</h4>
                      <Badge variant="outline" className="text-xs border-slate-600">
                        {category.retention}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">
                      <strong>Examples:</strong> {category.examples?.join(', ')}
                    </p>
                    <p className="text-sm text-slate-500">
                      <strong>Purpose:</strong> {category.purpose}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Client Rights */}
          <Card className="bg-navy-900/60 border-navy-700">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Scale className="h-5 w-5 text-emerald-400" />
                Client Rights Under POPIA
              </CardTitle>
              <CardDescription>
                Rights that your clients have regarding their personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {privacyReport?.client_rights?.map((right, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-navy-800/50 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">{right}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Retention Policy */}
          <Card className="bg-navy-900/60 border-navy-700">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-400" />
                Data Retention Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {privacyReport?.data_retention_policy && Object.entries(privacyReport.data_retention_policy).map(([key, value], index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-navy-800/50 rounded-lg">
                    <span className="text-sm text-slate-300 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm text-slate-400">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Consent Statement */}
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-400 mb-1">Client Consent Reminder</h4>
                  <p className="text-sm text-slate-300">
                    {privacyReport?.consent_text || 'Ensure you obtain proper consent from clients before collecting their personal information.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityPage;
