import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Upload, Loader2, CheckCircle2, AlertCircle, 
  User, CreditCard, PiggyBank, Receipt, TrendingUp,
  Building2, Trash2, Save, Download, Eye, Clock,
  Banknote, Percent, FileWarning, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Disclaimer } from '@/components/calculators/Disclaimer';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Document type icons
const docTypeIcons = {
  'Investment Statement': TrendingUp,
  'Bank Statement': Building2,
  'Pension Statement': PiggyBank,
  'IRP5 Certificate': Receipt,
  'Other': FileText,
  'Unknown': FileWarning,
};

// Format currency
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  if (isNaN(num)) return value;
  return `R ${num.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Analysis Result Component
const AnalysisResult = ({ analysis, onSaveToClient, onDelete, clients }) => {
  const [selectedClient, setSelectedClient] = useState('');
  const [saving, setSaving] = useState(false);
  
  const data = analysis.analysis || {};
  const DocIcon = docTypeIcons[analysis.document_type] || FileText;
  
  const handleSave = async () => {
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }
    setSaving(true);
    try {
      await onSaveToClient(analysis.id, selectedClient);
      toast.success('Saved to client profile');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-navy-900/60 border-navy-700">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <DocIcon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg text-white">{analysis.document_type || 'Document Analysis'}</CardTitle>
              <p className="text-sm text-slate-400">{analysis.file_name}</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Analyzed
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="bg-navy-800 w-full grid grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>
          
          {/* Summary Tab */}
          <TabsContent value="summary" className="mt-4 space-y-4">
            {/* Personal Details */}
            {data.personal_details && (
              <div className="p-4 rounded-lg bg-navy-800/50 border border-navy-700">
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {data.personal_details.full_name && (
                    <div>
                      <span className="text-slate-500">Name:</span>
                      <span className="ml-2 text-white">{data.personal_details.full_name}</span>
                    </div>
                  )}
                  {data.personal_details.id_number && (
                    <div>
                      <span className="text-slate-500">ID:</span>
                      <span className="ml-2 text-white">{data.personal_details.id_number}</span>
                    </div>
                  )}
                  {data.personal_details.account_numbers && (
                    <div className="col-span-2">
                      <span className="text-slate-500">Account:</span>
                      <span className="ml-2 text-white">
                        {Array.isArray(data.personal_details.account_numbers) 
                          ? data.personal_details.account_numbers.join(', ')
                          : data.personal_details.account_numbers}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Account Summary */}
            {data.account_summary && (
              <div className="p-4 rounded-lg bg-navy-800/50 border border-navy-700">
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Account Summary
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {data.account_summary.total_value && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-xs text-slate-400">Total Value</p>
                      <p className="text-xl font-bold text-emerald-400">
                        {formatCurrency(data.account_summary.total_value)}
                      </p>
                    </div>
                  )}
                  {data.account_summary.statement_date && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-xs text-slate-400">Statement Date</p>
                      <p className="text-lg font-semibold text-blue-400">
                        {data.account_summary.statement_date}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Fees */}
            {data.fees_and_charges && (
              <div className="p-4 rounded-lg bg-navy-800/50 border border-navy-700">
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Fees & Charges
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(data.fees_and_charges).map(([key, value]) => (
                    value && (
                      <div key={key}>
                        <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="ml-2 text-amber-400">{formatCurrency(value)}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
            
            {/* Key Insights */}
            {data.key_insights && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <h4 className="text-sm font-medium text-amber-400 mb-2">Key Insights</h4>
                <ul className="space-y-1 text-sm text-slate-300">
                  {Array.isArray(data.key_insights) 
                    ? data.key_insights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                          {insight}
                        </li>
                      ))
                    : <li>{data.key_insights}</li>
                  }
                </ul>
              </div>
            )}
          </TabsContent>
          
          {/* Details Tab */}
          <TabsContent value="details" className="mt-4 space-y-4">
            {/* Holdings */}
            {data.holdings_assets && Array.isArray(data.holdings_assets) && data.holdings_assets.length > 0 && (
              <div className="p-4 rounded-lg bg-navy-800/50 border border-navy-700">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Holdings/Assets</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy-600">
                        <th className="text-left py-2 text-slate-400">Fund/Asset</th>
                        <th className="text-right py-2 text-slate-400">Value</th>
                        <th className="text-right py-2 text-slate-400">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.holdings_assets.map((holding, idx) => (
                        <tr key={idx} className="border-b border-navy-700/50">
                          <td className="py-2 text-white">{holding.fund_name || holding.name}</td>
                          <td className="py-2 text-right text-emerald-400">{formatCurrency(holding.value)}</td>
                          <td className="py-2 text-right text-slate-400">{holding.percentage || '-'}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Tax Information (for IRP5) */}
            {data.tax_information && (
              <div className="p-4 rounded-lg bg-navy-800/50 border border-navy-700">
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Tax Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {data.tax_information.gross_income && (
                    <div>
                      <span className="text-slate-500">Gross Income:</span>
                      <span className="ml-2 text-white">{formatCurrency(data.tax_information.gross_income)}</span>
                    </div>
                  )}
                  {data.tax_information.paye_deducted && (
                    <div>
                      <span className="text-slate-500">PAYE Deducted:</span>
                      <span className="ml-2 text-red-400">{formatCurrency(data.tax_information.paye_deducted)}</span>
                    </div>
                  )}
                  {data.tax_information.pension_contributions && (
                    <div>
                      <span className="text-slate-500">Pension/RA:</span>
                      <span className="ml-2 text-emerald-400">{formatCurrency(data.tax_information.pension_contributions)}</span>
                    </div>
                  )}
                  {data.tax_information.medical_aid && (
                    <div>
                      <span className="text-slate-500">Medical Aid:</span>
                      <span className="ml-2 text-blue-400">{formatCurrency(data.tax_information.medical_aid)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions" className="mt-4">
            {data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0 ? (
              <div className="p-4 rounded-lg bg-navy-800/50 border border-navy-700">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy-600">
                        <th className="text-left py-2 text-slate-400">Date</th>
                        <th className="text-left py-2 text-slate-400">Description</th>
                        <th className="text-right py-2 text-slate-400">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.transactions.map((tx, idx) => (
                        <tr key={idx} className="border-b border-navy-700/50">
                          <td className="py-2 text-slate-400">{tx.date}</td>
                          <td className="py-2 text-white">{tx.description}</td>
                          <td className={`py-2 text-right ${parseFloat(String(tx.amount).replace(/[^0-9.-]/g, '')) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatCurrency(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No transactions found in this document</p>
              </div>
            )}
          </TabsContent>
          
          {/* Raw Data Tab */}
          <TabsContent value="raw" className="mt-4">
            <div className="p-4 rounded-lg bg-navy-800/50 border border-navy-700">
              <pre className="text-xs text-slate-300 overflow-auto max-h-96 whitespace-pre-wrap">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-navy-700">
          <div className="flex-1 flex items-center gap-2">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[200px] bg-navy-800 border-navy-600">
                <SelectValue placeholder="Select client..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleSave} 
              disabled={!selectedClient || saving}
              className="bg-emerald-500 hover:bg-emerald-400"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save to Client
            </Button>
          </div>
          <Button 
            variant="outline" 
            className="text-red-400 border-red-500/50 hover:bg-red-500/10"
            onClick={() => onDelete(analysis.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const DocumentReader = () => {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [analyses, setAnalyses] = useState([]);
  const [clients, setClients] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPromptInput, setShowPromptInput] = useState(false);
  
  // Example prompts for users
  const examplePrompts = [
    { label: 'Calculate Total Fees', prompt: 'Calculate all fees and charges in this document. Break down management fees, admin fees, and any other costs. Show the total annual fee as a percentage.' },
    { label: 'Rate of Return', prompt: 'Calculate the rate of return or investment performance shown in this document. Include any benchmark comparisons if available.' },
    { label: 'Fund Breakdown', prompt: 'List all funds or holdings in this document with their values and allocation percentages. Identify the asset allocation (equity, bonds, cash, etc.).' },
    { label: 'Tax Summary', prompt: 'Extract all tax-related information from this document including gross income, PAYE, pension contributions, and any deductions.' },
    { label: 'Key Details Only', prompt: 'Extract only the most important details: account holder name, account number, total value, and statement date.' },
    { label: 'Full Analysis', prompt: 'Provide a comprehensive analysis of this document including all personal details, account information, holdings, fees, transactions, and any key insights or concerns.' },
  ];
  
  // Fetch existing analyses and clients
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analysesRes, clientsRes] = await Promise.all([
          axios.get(`${API_URL}/api/documents/analyses`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/api/clients`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setAnalyses(analysesRes.data.analyses || []);
        setClients(clientsRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    if (token) fetchData();
  }, [token]);
  
  // Handle file drop - just store the file, don't analyze yet
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setSelectedFile(file);
    setShowPromptInput(true);
    setCurrentAnalysis(null);
  }, []);
  
  // Analyze with custom prompt
  const handleAnalyze = async (prompt) => {
    if (!selectedFile) return;
    
    setUploading(true);
    setShowPromptInput(false);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    if (prompt) {
      formData.append('custom_prompt', prompt);
    }
    
    try {
      const response = await axios.post(
        `${API_URL}/api/documents/analyze`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Document analyzed successfully!');
        setCurrentAnalysis(response.data.document);
        setAnalyses(prev => [response.data.document, ...prev]);
        setSelectedFile(null);
        setCustomPrompt('');
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to analyze document';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024 // 20MB
  });
  
  // Save to client
  const handleSaveToClient = async (analysisId, clientId) => {
    await axios.post(
      `${API_URL}/api/documents/save-to-client`,
      { analysis_id: analysisId, client_id: clientId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };
  
  // Delete analysis
  const handleDelete = async (analysisId) => {
    try {
      await axios.delete(`${API_URL}/api/documents/analyses/${analysisId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalyses(prev => prev.filter(a => a.id !== analysisId));
      if (currentAnalysis?.id === analysisId) {
        setCurrentAnalysis(null);
      }
      toast.success('Analysis deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };
  
  // Cancel file selection
  const handleCancelFile = () => {
    setSelectedFile(null);
    setShowPromptInput(false);
    setCustomPrompt('');
  };

  return (
    <div className="min-h-screen bg-navy-950 py-8" data-testid="document-reader">
      <Disclaimer />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AI Document Reader</h1>
          <p className="text-slate-400">
            Upload financial statements and let AI extract key information automatically
          </p>
        </div>
        
        {/* Upload Area or Prompt Selection */}
        <Card className="bg-navy-900/60 border-navy-700 mb-8">
          <CardContent className="p-8">
            {!showPromptInput ? (
              /* File Upload Zone */
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
                  ${isDragActive 
                    ? 'border-emerald-500 bg-emerald-500/10' 
                    : 'border-navy-600 hover:border-emerald-500/50 hover:bg-navy-800/50'
                  }
                  ${uploading ? 'pointer-events-none opacity-50' : ''}
                `}
              >
                <input {...getInputProps()} />
                
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-16 w-16 text-emerald-400 animate-spin mb-4" />
                    <p className="text-lg text-white mb-2">Analyzing document...</p>
                    <p className="text-sm text-slate-400">This may take a few seconds</p>
                  </div>
                ) : isDragActive ? (
                  <div className="flex flex-col items-center">
                    <Upload className="h-16 w-16 text-emerald-400 mb-4" />
                    <p className="text-lg text-white">Drop the file here</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-4">
                      <FileText className="h-10 w-10" />
                    </div>
                    <p className="text-lg text-white mb-2">
                      Drag & drop a document, or click to browse
                    </p>
                    <p className="text-sm text-slate-400 mb-4">
                      Supports PDF, PNG, JPG, JPEG, WEBP • Max 20MB
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Badge variant="outline" className="text-slate-400 border-slate-600">
                        Investment Statements
                      </Badge>
                      <Badge variant="outline" className="text-slate-400 border-slate-600">
                        Bank Statements
                      </Badge>
                      <Badge variant="outline" className="text-slate-400 border-slate-600">
                        IRP5 Certificates
                      </Badge>
                      <Badge variant="outline" className="text-slate-400 border-slate-600">
                        Pension Statements
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Prompt Selection UI */
              <div className="space-y-6">
                {/* Selected File Info */}
                <div className="flex items-center justify-between p-4 bg-navy-800/50 rounded-lg border border-navy-600">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{selectedFile?.name}</p>
                      <p className="text-sm text-slate-400">
                        {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="text-slate-400 hover:text-white"
                    onClick={handleCancelFile}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
                
                {/* What to Extract Section */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">What would you like to extract?</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Choose a preset analysis or write your own custom prompt
                  </p>
                  
                  {/* Quick Presets */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {examplePrompts.map((example, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="h-auto py-3 px-4 text-left border-navy-600 hover:border-emerald-500/50 hover:bg-emerald-500/10"
                        onClick={() => handleAnalyze(example.prompt)}
                      >
                        <div className="w-full">
                          <p className="text-sm font-medium text-white">{example.label}</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                  
                  {/* Custom Prompt Input */}
                  <div className="space-y-3">
                    <Label className="text-white">Or write a custom prompt:</Label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="E.g., Calculate the effective annual cost of this investment including all fees. Also identify any red flags or concerns..."
                      className="w-full h-32 px-4 py-3 rounded-lg bg-navy-800 border border-navy-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        className="border-slate-600"
                        onClick={handleCancelFile}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="bg-emerald-500 hover:bg-emerald-400 text-navy-950"
                        onClick={() => handleAnalyze(customPrompt || 'Provide a comprehensive analysis of this document including all personal details, account information, holdings, fees, transactions, and any key insights.')}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Analyze Document
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Current Analysis Result */}
        {currentAnalysis && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Analysis Result</h2>
            <AnalysisResult 
              analysis={currentAnalysis}
              onSaveToClient={handleSaveToClient}
              onDelete={handleDelete}
              clients={clients}
            />
          </div>
        )}
        
        {/* Previous Analyses */}
        {analyses.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-400" />
              Recent Analyses
              <Badge variant="outline" className="ml-2">{analyses.length}</Badge>
            </h2>
            <div className="grid gap-4">
              {analyses.filter(a => a.id !== currentAnalysis?.id).slice(0, 5).map(analysis => (
                <Card 
                  key={analysis.id} 
                  className="bg-navy-900/40 border-navy-700 hover:border-emerald-500/30 transition-colors cursor-pointer"
                  onClick={() => setCurrentAnalysis(analysis)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-800 text-emerald-400">
                        {React.createElement(docTypeIcons[analysis.document_type] || FileText, { className: "h-5 w-5" })}
                      </div>
                      <div>
                        <p className="text-white font-medium">{analysis.document_type || 'Document'}</p>
                        <p className="text-sm text-slate-400">{analysis.file_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500">
                        {new Date(analysis.created_at).toLocaleDateString('en-ZA')}
                      </span>
                      <Eye className="h-4 w-4 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentReader;
