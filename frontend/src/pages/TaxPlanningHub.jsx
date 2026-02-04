import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, FileText, TrendingUp, PiggyBank, Heart, 
  Briefcase, Banknote, BarChart3, Shield, AlertTriangle,
  CheckCircle2, Info, Download, Upload, Plus, Trash2,
  ChevronRight, Percent, Building, User, Users, File,
  Calendar, Eye, X
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { PrintReport } from '../components/calculators/PrintReport';
import { Disclaimer } from '../components/calculators/Disclaimer';
import { InfoTooltip, SectionInfo } from '../components/ui/info-tooltip';
import { toast } from 'sonner';

// 2025/2026 South African Tax Tables
const TAX_BRACKETS_2025 = [
  { min: 0, max: 237100, rate: 0.18, base: 0 },
  { min: 237101, max: 370500, rate: 0.26, base: 42678 },
  { min: 370501, max: 512800, rate: 0.31, base: 77362 },
  { min: 512801, max: 673000, rate: 0.36, base: 121475 },
  { min: 673001, max: 857900, rate: 0.39, base: 179147 },
  { min: 857901, max: 1817000, rate: 0.41, base: 251258 },
  { min: 1817001, max: Infinity, rate: 0.45, base: 644489 },
];

// Tax Rebates 2025/2026
const TAX_REBATES = {
  primary: 17235,      // All taxpayers
  secondary: 9444,     // 65 and older
  tertiary: 3145,      // 75 and older
};

// Tax Thresholds 2025/2026
const TAX_THRESHOLDS = {
  under65: 95750,
  age65to74: 148217,
  age75plus: 165689,
};

// Medical Tax Credits 2025/2026
const MEDICAL_CREDITS = {
  mainMember: 364,      // Per month
  firstDependent: 364,  // Per month  
  additionalDependent: 246, // Per month
};

// CGT Constants
const CGT = {
  inclusionRate: 0.40,        // 40% for individuals
  annualExclusion: 40000,     // R40,000 annual exclusion
  deathExclusion: 300000,     // R300,000 on death
  primaryResidence: 2000000,  // R2m primary residence exclusion
};

// TFSA Limits
const TFSA = {
  annualLimit: 36000,
  lifetimeLimit: 500000,
};

// Retirement Contribution Limits
const RETIREMENT = {
  maxDeductionPercent: 0.275, // 27.5% of taxable income
  maxDeductionAmount: 350000, // R350,000 cap
};

const TaxPlanningHub = () => {
  const { formatCurrency, currency, symbol } = useCurrency();
  const [activeTab, setActiveTab] = useState('income');
  
  // Income Tax Calculator State
  const [incomeData, setIncomeData] = useState({
    grossIncome: 0,
    otherIncome: 0,
    rentalIncome: 0,
    interestIncome: 0,
    dividendIncome: 0,
    retirementContributions: 0,
    raContributions: 0,
    travelAllowance: 0,
    homeOfficeDeduction: 0,
    ageGroup: 'under65',
    medicalMembers: 1,
    medicalDependents: 0,
    hasDisability: false,
    outOfPocketMedical: 0,
  });

  // CGT Calculator State
  const [cgtData, setCgtData] = useState({
    assetType: 'shares',
    purchasePrice: 0,
    salePrice: 0,
    purchaseDate: '',
    saleDate: '',
    improvements: 0,
    sellingCosts: 0,
    isPrimaryResidence: false,
    yearsOccupied: 0,
    usedForBusiness: 0,
    otherGainsThisYear: 0,
    otherLossesThisYear: 0,
  });

  // Tax Bracket Simulator State
  const [bracketData, setBracketData] = useState({
    currentIncome: 0,
    additionalIncome: 0,
    bonusAmount: 0,
  });

  // Provisional Tax State
  const [provisionalData, setProvisionalData] = useState({
    estimatedTaxableIncome: 0,
    previousYearTax: 0,
    firstPayment: 0,
    secondPayment: 0,
  });

  // IRP5 Storage State
  const [irp5Documents, setIrp5Documents] = useState([]);
  const [newIrp5, setNewIrp5] = useState({
    taxYear: '2025/2026',
    employer: '',
    grossIncome: 0,
    paye: 0,
    uif: 0,
    pensionContributions: 0,
    medicalAid: 0,
    notes: '',
  });

  // Handle IRP5 file upload (simulated - stores metadata)
  const handleAddIrp5 = () => {
    if (!newIrp5.employer || newIrp5.grossIncome <= 0) {
      toast.error('Please enter employer name and gross income');
      return;
    }
    
    const irp5Entry = {
      id: Date.now().toString(),
      ...newIrp5,
      dateAdded: new Date().toISOString(),
    };
    
    setIrp5Documents([...irp5Documents, irp5Entry]);
    setNewIrp5({
      taxYear: '2025/2026',
      employer: '',
      grossIncome: 0,
      paye: 0,
      uif: 0,
      pensionContributions: 0,
      medicalAid: 0,
      notes: '',
    });
    toast.success('IRP5 record added successfully');
  };

  const handleDeleteIrp5 = (id) => {
    setIrp5Documents(irp5Documents.filter(doc => doc.id !== id));
    toast.success('IRP5 record deleted');
  };

  // Calculate IRP5 totals
  const irp5Totals = irp5Documents.reduce((acc, doc) => ({
    grossIncome: acc.grossIncome + doc.grossIncome,
    paye: acc.paye + doc.paye,
    uif: acc.uif + doc.uif,
    pensionContributions: acc.pensionContributions + doc.pensionContributions,
    medicalAid: acc.medicalAid + doc.medicalAid,
  }), { grossIncome: 0, paye: 0, uif: 0, pensionContributions: 0, medicalAid: 0 });

  // Calculate Income Tax
  const calculateIncomeTax = useCallback(() => {
    const {
      grossIncome, otherIncome, rentalIncome, interestIncome, dividendIncome,
      retirementContributions, raContributions, travelAllowance, homeOfficeDeduction,
      ageGroup, medicalMembers, medicalDependents, hasDisability, outOfPocketMedical
    } = incomeData;

    // Total income
    const totalIncome = grossIncome + otherIncome + rentalIncome + interestIncome;
    
    // Interest exemption (R23,800 under 65, R34,500 65 and older)
    const interestExemption = ageGroup === 'under65' ? 23800 : 34500;
    const taxableInterest = Math.max(0, interestIncome - interestExemption);
    
    // Dividend exemption (dividends from SA companies are exempt, foreign dividends taxed)
    // Assuming SA dividends for simplicity
    const taxableDividends = 0;

    // Retirement deduction (27.5% of taxable income, max R350,000)
    const totalRetirement = retirementContributions + raContributions;
    const maxRetirementDeduction = Math.min(
      totalIncome * RETIREMENT.maxDeductionPercent,
      RETIREMENT.maxDeductionAmount
    );
    const retirementDeduction = Math.min(totalRetirement, maxRetirementDeduction);

    // Travel allowance deduction (simplified - 80% if no logbook)
    const travelDeduction = travelAllowance * 0.2; // Taxable portion

    // Calculate taxable income
    const taxableIncome = Math.max(0,
      totalIncome - retirementDeduction + taxableInterest - homeOfficeDeduction
    );

    // Calculate gross tax
    let grossTax = 0;
    for (const bracket of TAX_BRACKETS_2025) {
      if (taxableIncome >= bracket.min) {
        if (taxableIncome <= bracket.max) {
          grossTax = bracket.base + (taxableIncome - bracket.min + 1) * bracket.rate;
          break;
        }
      }
    }

    // Apply rebates
    let totalRebates = TAX_REBATES.primary;
    if (ageGroup === '65to74') totalRebates += TAX_REBATES.secondary;
    if (ageGroup === '75plus') totalRebates += TAX_REBATES.secondary + TAX_REBATES.tertiary;

    // Medical tax credits
    const monthlyMedicalCredit = 
      MEDICAL_CREDITS.mainMember + 
      (medicalDependents >= 1 ? MEDICAL_CREDITS.firstDependent : 0) +
      (Math.max(0, medicalDependents - 1) * MEDICAL_CREDITS.additionalDependent);
    const annualMedicalCredit = monthlyMedicalCredit * 12;

    // Additional medical expenses tax credit
    let additionalMedicalCredit = 0;
    if (outOfPocketMedical > 0) {
      if (hasDisability || ageGroup !== 'under65') {
        // 33.3% of all qualifying expenses
        additionalMedicalCredit = outOfPocketMedical * 0.333;
      } else {
        // 25% of expenses exceeding 7.5% of taxable income
        const threshold = taxableIncome * 0.075;
        const excessMedical = Math.max(0, outOfPocketMedical - threshold);
        additionalMedicalCredit = excessMedical * 0.25;
      }
    }

    const totalMedicalCredits = annualMedicalCredit + additionalMedicalCredit;

    // Final tax
    const taxBeforeCredits = Math.max(0, grossTax - totalRebates);
    const finalTax = Math.max(0, taxBeforeCredits - totalMedicalCredits);

    // Effective tax rate
    const effectiveRate = taxableIncome > 0 ? (finalTax / taxableIncome) * 100 : 0;

    // Monthly PAYE
    const monthlyPAYE = finalTax / 12;

    // Find marginal rate
    let marginalRate = 18;
    for (const bracket of TAX_BRACKETS_2025) {
      if (taxableIncome >= bracket.min && taxableIncome <= bracket.max) {
        marginalRate = bracket.rate * 100;
        break;
      }
    }

    return {
      totalIncome,
      taxableIncome,
      retirementDeduction,
      grossTax,
      totalRebates,
      annualMedicalCredit,
      additionalMedicalCredit,
      totalMedicalCredits,
      finalTax,
      effectiveRate,
      monthlyPAYE,
      marginalRate,
      taxSavingsFromRetirement: retirementDeduction * (marginalRate / 100),
    };
  }, [incomeData]);

  // Calculate CGT
  const calculateCGT = useCallback(() => {
    const {
      purchasePrice, salePrice, improvements, sellingCosts,
      isPrimaryResidence, yearsOccupied, usedForBusiness,
      otherGainsThisYear, otherLossesThisYear
    } = cgtData;

    // Base cost
    const baseCost = purchasePrice + improvements + sellingCosts;
    
    // Gross capital gain/loss
    const grossGain = salePrice - baseCost;

    // Primary residence exclusion
    let primaryResidenceExclusion = 0;
    if (isPrimaryResidence && grossGain > 0) {
      primaryResidenceExclusion = Math.min(grossGain, CGT.primaryResidence);
    }

    // Adjust for business use
    const businessPortion = usedForBusiness / 100;
    const residentialGain = grossGain * (1 - businessPortion);
    const businessGain = grossGain * businessPortion;
    
    const gainAfterResidenceExclusion = Math.max(0, residentialGain - primaryResidenceExclusion) + businessGain;

    // Add other gains/losses
    const totalGains = gainAfterResidenceExclusion + otherGainsThisYear - otherLossesThisYear;

    // Annual exclusion
    const annualExclusion = CGT.annualExclusion;
    const taxableGain = Math.max(0, totalGains - annualExclusion);

    // Inclusion amount (40% for individuals)
    const inclusionAmount = taxableGain * CGT.inclusionRate;

    // CGT is added to taxable income and taxed at marginal rate
    // For estimation, use average marginal rate based on income tax calculation
    const estimatedMarginalRate = incomeData.grossIncome > 500000 ? 0.36 : 
                                   incomeData.grossIncome > 200000 ? 0.26 : 0.18;
    const estimatedCGT = inclusionAmount * estimatedMarginalRate;

    // Effective CGT rate
    const effectiveCGTRate = taxableGain > 0 ? (estimatedCGT / taxableGain) * 100 : 0;

    return {
      grossGain,
      primaryResidenceExclusion,
      gainAfterResidenceExclusion,
      totalGains,
      annualExclusion,
      taxableGain,
      inclusionAmount,
      estimatedCGT,
      effectiveCGTRate,
      baseCost,
    };
  }, [cgtData, incomeData.grossIncome]);

  // Calculate Tax Bracket Impact
  const calculateBracketImpact = useCallback(() => {
    const { currentIncome, additionalIncome, bonusAmount } = bracketData;
    
    const totalAdditional = additionalIncome + bonusAmount;
    const newIncome = currentIncome + totalAdditional;

    // Find current and new brackets
    const findBracket = (income) => {
      for (let i = TAX_BRACKETS_2025.length - 1; i >= 0; i--) {
        if (income >= TAX_BRACKETS_2025[i].min) {
          return { ...TAX_BRACKETS_2025[i], index: i };
        }
      }
      return { ...TAX_BRACKETS_2025[0], index: 0 };
    };

    const currentBracket = findBracket(currentIncome);
    const newBracket = findBracket(newIncome);

    // Calculate tax on additional income at marginal rate
    const taxOnAdditional = totalAdditional * newBracket.rate;
    const effectiveRateOnAdditional = totalAdditional > 0 ? (taxOnAdditional / totalAdditional) * 100 : 0;

    // Calculate if bracket will change
    const bracketChange = newBracket.index > currentBracket.index;
    const nextBracketThreshold = currentBracket.max;
    const roomInCurrentBracket = Math.max(0, nextBracketThreshold - currentIncome);

    return {
      currentBracket: currentBracket.rate * 100,
      newBracket: newBracket.rate * 100,
      taxOnAdditional,
      effectiveRateOnAdditional,
      bracketChange,
      nextBracketThreshold,
      roomInCurrentBracket,
      newIncome,
    };
  }, [bracketData]);

  // Calculate Provisional Tax
  const calculateProvisionalTax = useCallback(() => {
    const { estimatedTaxableIncome, previousYearTax, firstPayment, secondPayment } = provisionalData;
    
    // Calculate estimated tax for the year
    let estimatedTax = 0;
    for (const bracket of TAX_BRACKETS_2025) {
      if (estimatedTaxableIncome >= bracket.min) {
        if (estimatedTaxableIncome <= bracket.max) {
          estimatedTax = bracket.base + (estimatedTaxableIncome - bracket.min + 1) * bracket.rate;
          break;
        }
      }
    }

    // Apply primary rebate
    estimatedTax = Math.max(0, estimatedTax - TAX_REBATES.primary);

    // First payment (due end of August) - 50% of estimated tax
    const recommendedFirst = estimatedTax * 0.5;

    // Second payment (due end of February) - remaining 50%
    const recommendedSecond = estimatedTax * 0.5;

    // Third payment (if applicable) - top-up within 7 months after year end
    const totalPaid = firstPayment + secondPayment;
    const remaining = Math.max(0, estimatedTax - totalPaid);

    // Interest penalty estimation if underpaid
    const underpayment = Math.max(0, estimatedTax - totalPaid);
    const penaltyEstimate = underpayment * 0.1; // Simplified 10% penalty

    return {
      estimatedTax,
      recommendedFirst,
      recommendedSecond,
      totalPaid,
      remaining,
      underpayment,
      penaltyEstimate,
    };
  }, [provisionalData]);

  const incomeTaxResults = calculateIncomeTax();
  const cgtResults = calculateCGT();
  const bracketResults = calculateBracketImpact();
  const provisionalResults = calculateProvisionalTax();

  const InputField = ({ label, id, value, onChange, prefix, suffix, min = 0, step = 1, tooltip }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm text-slate-300">{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{prefix}</span>
        )}
        <Input
          id={id}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`bg-navy-800 border-navy-600 text-white ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''}`}
          min={min}
          step={step}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{suffix}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="tax-planning-hub">
      <Disclaimer />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Calculator className="h-7 w-7 text-emerald-400" />
            Tax Planning Hub
          </h1>
          <p className="text-slate-400 mt-1">
            2025/2026 Tax Year • Comprehensive tax planning and simulation
          </p>
        </div>
        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
          2025/2026 Tax Tables
        </Badge>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 bg-navy-800 h-auto p-1">
          <TabsTrigger value="income" className="data-[state=active]:bg-emerald-500/20 flex flex-col py-2">
            <span className="text-sm font-bold mb-1">R</span>
            <span className="text-xs">Income Tax</span>
          </TabsTrigger>
          <TabsTrigger value="cgt" className="data-[state=active]:bg-emerald-500/20 flex flex-col py-2">
            <TrendingUp className="h-4 w-4 mb-1" />
            <span className="text-xs">CGT</span>
          </TabsTrigger>
          <TabsTrigger value="brackets" className="data-[state=active]:bg-emerald-500/20 flex flex-col py-2">
            <BarChart3 className="h-4 w-4 mb-1" />
            <span className="text-xs">Brackets</span>
          </TabsTrigger>
          <TabsTrigger value="medical" className="data-[state=active]:bg-emerald-500/20 flex flex-col py-2">
            <Heart className="h-4 w-4 mb-1" />
            <span className="text-xs">Medical</span>
          </TabsTrigger>
          <TabsTrigger value="provisional" className="data-[state=active]:bg-emerald-500/20 flex flex-col py-2">
            <Briefcase className="h-4 w-4 mb-1" />
            <span className="text-xs">Provisional</span>
          </TabsTrigger>
          <TabsTrigger value="irp5" className="data-[state=active]:bg-emerald-500/20 flex flex-col py-2">
            <FileText className="h-4 w-4 mb-1" />
            <span className="text-xs">IRP5</span>
          </TabsTrigger>
        </TabsList>

        {/* Income Tax Calculator */}
        <TabsContent value="income" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <div className="space-y-6">
              {/* Income Sources */}
              <Card className="bg-navy-900/60 border-navy-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">R</span>
                    Income Sources
                    <SectionInfo
                      title="Income Sources"
                      description="Enter all your taxable income for the tax year. This includes salary, rental income, interest, and any other earnings that SARS considers taxable."
                      tips={[
                        "Include your total annual salary before tax (gross)",
                        "Local dividends are tax-free but foreign dividends are taxable",
                        "Interest under R23,800 (under 65) or R34,500 (65+) is tax-free"
                      ]}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InputField
                    label="Gross Salary / Employment Income"
                    id="grossIncome"
                    value={incomeData.grossIncome}
                    onChange={(val) => setIncomeData({...incomeData, grossIncome: val})}
                    prefix={symbol}
                    step={1000}
                    tooltip="Your total annual salary before any deductions (before PAYE)"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Other Income"
                      id="otherIncome"
                      value={incomeData.otherIncome}
                      onChange={(val) => setIncomeData({...incomeData, otherIncome: val})}
                      prefix={symbol}
                      tooltip="Freelance income, commissions, bonuses not included in salary"
                    />
                    <InputField
                      label="Rental Income"
                      id="rentalIncome"
                      value={incomeData.rentalIncome}
                      onChange={(val) => setIncomeData({...incomeData, rentalIncome: val})}
                      prefix={symbol}
                      tooltip="Net rental income after allowable deductions (rates, repairs, interest)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Interest Income"
                      id="interestIncome"
                      value={incomeData.interestIncome}
                      onChange={(val) => setIncomeData({...incomeData, interestIncome: val})}
                      prefix={symbol}
                      tooltip="Interest from savings, fixed deposits. First R23,800 is exempt (R34,500 if 65+)"
                    />
                    <InputField
                      label="Dividend Income (Foreign)"
                      id="dividendIncome"
                      value={incomeData.dividendIncome}
                      onChange={(val) => setIncomeData({...incomeData, dividendIncome: val})}
                      prefix={symbol}
                      tooltip="Foreign dividends are taxable. Local SA dividends are exempt from income tax"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Deductions */}
              <Card className="bg-navy-900/60 border-navy-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-emerald-400" />
                    Deductions & Contributions
                    <SectionInfo
                      title="Tax Deductions"
                      description="These contributions reduce your taxable income, lowering your tax bill. Retirement contributions are limited to 27.5% of taxable income or R350,000."
                      tips={[
                        "Pension + RA contributions combined are capped at 27.5%",
                        "Home office must be regularly and exclusively used for work",
                        "Keep records of all deductions for SARS audits"
                      ]}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Pension Fund Contributions"
                      id="retirementContributions"
                      value={incomeData.retirementContributions}
                      onChange={(val) => setIncomeData({...incomeData, retirementContributions: val})}
                      prefix={symbol}
                      tooltip="Your contributions to employer pension/provident fund (check your payslip)"
                    />
                    <InputField
                      label="RA Contributions"
                      id="raContributions"
                      value={incomeData.raContributions}
                      onChange={(val) => setIncomeData({...incomeData, raContributions: val})}
                      prefix={symbol}
                      tooltip="Private Retirement Annuity contributions you make yourself"
                    />
                  </div>
                  <InputField
                    label="Home Office Deduction"
                    id="homeOfficeDeduction"
                    value={incomeData.homeOfficeDeduction}
                    onChange={(val) => setIncomeData({...incomeData, homeOfficeDeduction: val})}
                    prefix={symbol}
                    tooltip="Portion of rent/bond, utilities for dedicated home office space"
                  />
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Age Group</Label>
                    <Select 
                      value={incomeData.ageGroup} 
                      onValueChange={(val) => setIncomeData({...incomeData, ageGroup: val})}
                    >
                      <SelectTrigger className="bg-navy-800 border-navy-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under65">Under 65</SelectItem>
                        <SelectItem value="65to74">65 to 74</SelectItem>
                        <SelectItem value="75plus">75 and older</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Medical */}
              <Card className="bg-navy-900/60 border-navy-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Heart className="h-5 w-5 text-emerald-400" />
                    Medical Aid
                    <SectionInfo
                      title="Medical Tax Credits"
                      description="Medical tax credits directly reduce your tax payable. You get a fixed monthly credit per member, plus additional credits for out-of-pocket medical expenses."
                      tips={[
                        "R364/month for main member and first dependent",
                        "R246/month for additional dependents",
                        "Keep medical receipts for additional credits"
                      ]}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-300">Medical Aid Members</Label>
                      <Select 
                        value={String(incomeData.medicalMembers)} 
                        onValueChange={(val) => setIncomeData({...incomeData, medicalMembers: parseInt(val)})}
                      >
                        <SelectTrigger className="bg-navy-800 border-navy-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">No Medical Aid</SelectItem>
                          <SelectItem value="1">Main Member Only</SelectItem>
                          <SelectItem value="2">Main + 1 Dependent</SelectItem>
                          <SelectItem value="3">Main + 2 Dependents</SelectItem>
                          <SelectItem value="4">Main + 3 Dependents</SelectItem>
                          <SelectItem value="5">Main + 4+ Dependents</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <InputField
                      label="Out-of-Pocket Medical"
                      id="outOfPocketMedical"
                      value={incomeData.outOfPocketMedical}
                      onChange={(val) => setIncomeData({...incomeData, outOfPocketMedical: val})}
                      prefix={symbol}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-navy-800 rounded-lg">
                    <Label className="text-sm text-slate-300">Disability (you or dependent)</Label>
                    <Switch
                      checked={incomeData.hasDisability}
                      onCheckedChange={(val) => setIncomeData({...incomeData, hasDisability: val})}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="space-y-6">
              {/* Tax Summary */}
              <Card className="bg-gradient-to-br from-emerald-500/10 to-navy-900 border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Tax Summary 2025/2026</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-navy-800/50 rounded-lg">
                      <p className="text-sm text-slate-400">Total Income</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(incomeTaxResults.totalIncome)}</p>
                    </div>
                    <div className="p-4 bg-navy-800/50 rounded-lg">
                      <p className="text-sm text-slate-400">Taxable Income</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(incomeTaxResults.taxableIncome)}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">Annual Tax Payable</p>
                    <p className="text-3xl font-bold text-red-400">{formatCurrency(incomeTaxResults.finalTax)}</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Monthly PAYE: {formatCurrency(incomeTaxResults.monthlyPAYE)}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Gross Tax</span>
                      <span className="text-white">{formatCurrency(incomeTaxResults.grossTax)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Less: Rebates</span>
                      <span className="text-emerald-400">-{formatCurrency(incomeTaxResults.totalRebates)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Less: Medical Credits</span>
                      <span className="text-emerald-400">-{formatCurrency(incomeTaxResults.totalMedicalCredits)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-navy-700">
                      <span className="text-slate-400">Effective Tax Rate</span>
                      <span className="text-white font-medium">{incomeTaxResults.effectiveRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Marginal Tax Rate</span>
                      <span className="text-white font-medium">{incomeTaxResults.marginalRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tax Savings */}
              <Card className="bg-navy-900/60 border-navy-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-emerald-400" />
                    Tax Savings Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Retirement Contribution Deduction</span>
                      <span className="text-emerald-400 font-medium">{formatCurrency(incomeTaxResults.retirementDeduction)}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Tax saved: {formatCurrency(incomeTaxResults.taxSavingsFromRetirement)}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Medical Scheme Credits</span>
                      <span className="text-blue-400 font-medium">{formatCurrency(incomeTaxResults.annualMedicalCredit)}</span>
                    </div>
                  </div>
                  {incomeTaxResults.additionalMedicalCredit > 0 && (
                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Additional Medical Credit</span>
                        <span className="text-purple-400 font-medium">{formatCurrency(incomeTaxResults.additionalMedicalCredit)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Print Report */}
              <PrintReport
                title="Income Tax Calculation"
                calculatorType="Tax Planning Hub"
                inputs={[
                  { label: 'Tax Year', value: '2025/2026' },
                  { label: 'Gross Income', value: formatCurrency(incomeData.grossIncome) },
                  { label: 'Retirement Contributions', value: formatCurrency(incomeData.retirementContributions + incomeData.raContributions) },
                  { label: 'Age Group', value: incomeData.ageGroup === 'under65' ? 'Under 65' : incomeData.ageGroup === '65to74' ? '65-74' : '75+' },
                ]}
                results={[
                  { label: 'Taxable Income', value: formatCurrency(incomeTaxResults.taxableIncome) },
                  { label: 'Annual Tax', value: formatCurrency(incomeTaxResults.finalTax) },
                  { label: 'Monthly PAYE', value: formatCurrency(incomeTaxResults.monthlyPAYE) },
                  { label: 'Effective Rate', value: `${incomeTaxResults.effectiveRate.toFixed(2)}%` },
                  { label: 'Marginal Rate', value: `${incomeTaxResults.marginalRate}%` },
                ]}
              />
            </div>
          </div>
        </TabsContent>

        {/* CGT Calculator */}
        <TabsContent value="cgt" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card className="bg-navy-900/60 border-navy-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    Asset Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Asset Type</Label>
                    <Select 
                      value={cgtData.assetType} 
                      onValueChange={(val) => setCgtData({...cgtData, assetType: val})}
                    >
                      <SelectTrigger className="bg-navy-800 border-navy-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shares">Shares / Unit Trusts</SelectItem>
                        <SelectItem value="property">Property</SelectItem>
                        <SelectItem value="crypto">Cryptocurrency</SelectItem>
                        <SelectItem value="other">Other Assets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Purchase Price"
                      id="purchasePrice"
                      value={cgtData.purchasePrice}
                      onChange={(val) => setCgtData({...cgtData, purchasePrice: val})}
                      prefix={symbol}
                    />
                    <InputField
                      label="Sale Price"
                      id="salePrice"
                      value={cgtData.salePrice}
                      onChange={(val) => setCgtData({...cgtData, salePrice: val})}
                      prefix={symbol}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Improvements / Costs"
                      id="improvements"
                      value={cgtData.improvements}
                      onChange={(val) => setCgtData({...cgtData, improvements: val})}
                      prefix={symbol}
                    />
                    <InputField
                      label="Selling Costs"
                      id="sellingCosts"
                      value={cgtData.sellingCosts}
                      onChange={(val) => setCgtData({...cgtData, sellingCosts: val})}
                      prefix={symbol}
                    />
                  </div>
                  
                  {cgtData.assetType === 'property' && (
                    <div className="space-y-4 p-4 bg-navy-800/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-slate-300">Primary Residence?</Label>
                        <Switch
                          checked={cgtData.isPrimaryResidence}
                          onCheckedChange={(val) => setCgtData({...cgtData, isPrimaryResidence: val})}
                        />
                      </div>
                      {cgtData.isPrimaryResidence && (
                        <InputField
                          label="% Used for Business"
                          id="usedForBusiness"
                          value={cgtData.usedForBusiness}
                          onChange={(val) => setCgtData({...cgtData, usedForBusiness: val})}
                          suffix="%"
                          min={0}
                          step={5}
                        />
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Other Gains This Year"
                      id="otherGainsThisYear"
                      value={cgtData.otherGainsThisYear}
                      onChange={(val) => setCgtData({...cgtData, otherGainsThisYear: val})}
                      prefix={symbol}
                    />
                    <InputField
                      label="Other Losses This Year"
                      id="otherLossesThisYear"
                      value={cgtData.otherLossesThisYear}
                      onChange={(val) => setCgtData({...cgtData, otherLossesThisYear: val})}
                      prefix={symbol}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-amber-500/10 to-navy-900 border-amber-500/30">
                <CardHeader>
                  <CardTitle className="text-lg text-white">CGT Calculation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-navy-800/50 rounded-lg">
                      <p className="text-sm text-slate-400">Base Cost</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(cgtResults.baseCost)}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${cgtResults.grossGain >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      <p className="text-sm text-slate-400">Gross Gain/Loss</p>
                      <p className={`text-xl font-bold ${cgtResults.grossGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(cgtResults.grossGain)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {cgtResults.primaryResidenceExclusion > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Less: Primary Residence Exclusion</span>
                        <span className="text-emerald-400">-{formatCurrency(cgtResults.primaryResidenceExclusion)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Net Capital Gain/Loss</span>
                      <span className="text-white">{formatCurrency(cgtResults.totalGains)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Less: Annual Exclusion</span>
                      <span className="text-emerald-400">-{formatCurrency(cgtResults.annualExclusion)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-navy-700">
                      <span className="text-slate-400">Taxable Capital Gain</span>
                      <span className="text-white font-medium">{formatCurrency(cgtResults.taxableGain)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Inclusion Amount (40%)</span>
                      <span className="text-white">{formatCurrency(cgtResults.inclusionAmount)}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-sm text-amber-400">Estimated CGT Payable</p>
                    <p className="text-3xl font-bold text-amber-400">{formatCurrency(cgtResults.estimatedCGT)}</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Effective CGT Rate: {cgtResults.effectiveCGTRate.toFixed(2)}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-500/10 border-blue-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-400 mb-1">CGT Key Points</h4>
                      <ul className="text-sm text-slate-300 space-y-1">
                        <li>• 40% inclusion rate for individuals</li>
                        <li>• R40,000 annual exclusion</li>
                        <li>• R2m primary residence exclusion</li>
                        <li>• CGT is added to taxable income</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tax Bracket Simulator */}
        <TabsContent value="brackets" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                  Income Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputField
                  label="Current Taxable Income"
                  id="currentIncome"
                  value={bracketData.currentIncome}
                  onChange={(val) => setBracketData({...bracketData, currentIncome: val})}
                  prefix={symbol}
                  step={10000}
                />
                <InputField
                  label="Additional Income (salary increase, etc.)"
                  id="additionalIncome"
                  value={bracketData.additionalIncome}
                  onChange={(val) => setBracketData({...bracketData, additionalIncome: val})}
                  prefix={symbol}
                  step={5000}
                />
                <InputField
                  label="Bonus Amount"
                  id="bonusAmount"
                  value={bracketData.bonusAmount}
                  onChange={(val) => setBracketData({...bracketData, bonusAmount: val})}
                  prefix={symbol}
                  step={5000}
                />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-purple-500/10 to-navy-900 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Bracket Impact Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-navy-800/50 rounded-lg text-center">
                      <p className="text-sm text-slate-400">Current Bracket</p>
                      <p className="text-3xl font-bold text-white">{bracketResults.currentBracket}%</p>
                    </div>
                    <div className={`p-4 rounded-lg text-center ${bracketResults.bracketChange ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                      <p className="text-sm text-slate-400">New Bracket</p>
                      <p className={`text-3xl font-bold ${bracketResults.bracketChange ? 'text-red-400' : 'text-emerald-400'}`}>
                        {bracketResults.newBracket}%
                      </p>
                    </div>
                  </div>

                  {bracketResults.bracketChange && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <span className="text-amber-400 font-medium">Bracket Change Warning</span>
                      </div>
                      <p className="text-sm text-slate-300">
                        Your additional income will push you into a higher tax bracket.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Tax on Additional Income</span>
                      <span className="text-white">{formatCurrency(bracketResults.taxOnAdditional)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Effective Rate on Additional</span>
                      <span className="text-white">{bracketResults.effectiveRateOnAdditional.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Room in Current Bracket</span>
                      <span className="text-emerald-400">{formatCurrency(bracketResults.roomInCurrentBracket)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tax Brackets Reference */}
              <Card className="bg-navy-900/60 border-navy-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white">2025/2026 Tax Brackets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {TAX_BRACKETS_2025.map((bracket, index) => (
                      <div 
                        key={index} 
                        className={`flex justify-between p-2 rounded ${
                          bracketData.currentIncome >= bracket.min && bracketData.currentIncome <= bracket.max
                            ? 'bg-emerald-500/20 border border-emerald-500/30'
                            : 'bg-navy-800/50'
                        }`}
                      >
                        <span className="text-slate-300">
                          {formatCurrency(bracket.min)} - {bracket.max === Infinity ? '∞' : formatCurrency(bracket.max)}
                        </span>
                        <span className="text-white font-medium">{bracket.rate * 100}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Medical Credits */}
        <TabsContent value="medical" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Heart className="h-5 w-5 text-emerald-400" />
                  Medical Aid Credits Calculator
                </CardTitle>
                <CardDescription>Calculate your medical scheme fees tax credit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Medical Aid Members</Label>
                  <Select 
                    value={String(incomeData.medicalMembers)} 
                    onValueChange={(val) => setIncomeData({...incomeData, medicalMembers: parseInt(val)})}
                  >
                    <SelectTrigger className="bg-navy-800 border-navy-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No Medical Aid</SelectItem>
                      <SelectItem value="1">Main Member Only</SelectItem>
                      <SelectItem value="2">Main + 1 Dependent</SelectItem>
                      <SelectItem value="3">Main + 2 Dependents</SelectItem>
                      <SelectItem value="4">Main + 3 Dependents</SelectItem>
                      <SelectItem value="5">Main + 4 Dependents</SelectItem>
                      <SelectItem value="6">Main + 5+ Dependents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <InputField
                  label="Annual Out-of-Pocket Medical Expenses"
                  id="outOfPocketMedical2"
                  value={incomeData.outOfPocketMedical}
                  onChange={(val) => setIncomeData({...incomeData, outOfPocketMedical: val})}
                  prefix={symbol}
                />

                <div className="flex items-center justify-between p-3 bg-navy-800 rounded-lg">
                  <div>
                    <Label className="text-sm text-slate-300">Disability in Household</Label>
                    <p className="text-xs text-slate-500">You or a dependent has a qualifying disability</p>
                  </div>
                  <Switch
                    checked={incomeData.hasDisability}
                    onCheckedChange={(val) => setIncomeData({...incomeData, hasDisability: val})}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-pink-500/10 to-navy-900 border-pink-500/30">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Medical Tax Credit Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-lg">
                    <p className="text-sm text-pink-400">Total Annual Medical Credit</p>
                    <p className="text-3xl font-bold text-pink-400">{formatCurrency(incomeTaxResults.totalMedicalCredits)}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Medical Scheme Fees Credit</span>
                      <span className="text-white">{formatCurrency(incomeTaxResults.annualMedicalCredit)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Monthly Credit</span>
                      <span className="text-white">{formatCurrency(incomeTaxResults.annualMedicalCredit / 12)}</span>
                    </div>
                    {incomeTaxResults.additionalMedicalCredit > 0 && (
                      <div className="flex justify-between text-sm pt-2 border-t border-navy-700">
                        <span className="text-slate-400">Additional Medical Credit</span>
                        <span className="text-emerald-400">{formatCurrency(incomeTaxResults.additionalMedicalCredit)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-navy-900/60 border-navy-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white">2025/2026 Credit Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between p-2 bg-navy-800/50 rounded">
                      <span className="text-slate-300">Main Member</span>
                      <span className="text-white">R{MEDICAL_CREDITS.mainMember}/month</span>
                    </div>
                    <div className="flex justify-between p-2 bg-navy-800/50 rounded">
                      <span className="text-slate-300">First Dependent</span>
                      <span className="text-white">R{MEDICAL_CREDITS.firstDependent}/month</span>
                    </div>
                    <div className="flex justify-between p-2 bg-navy-800/50 rounded">
                      <span className="text-slate-300">Additional Dependents</span>
                      <span className="text-white">R{MEDICAL_CREDITS.additionalDependent}/month each</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Provisional Tax */}
        <TabsContent value="provisional" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-emerald-400" />
                  Provisional Tax Planner
                </CardTitle>
                <CardDescription>For self-employed and business owners</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputField
                  label="Estimated Taxable Income for Year"
                  id="estimatedTaxableIncome"
                  value={provisionalData.estimatedTaxableIncome}
                  onChange={(val) => setProvisionalData({...provisionalData, estimatedTaxableIncome: val})}
                  prefix={symbol}
                  step={10000}
                />
                <InputField
                  label="Previous Year's Tax Liability"
                  id="previousYearTax"
                  value={provisionalData.previousYearTax}
                  onChange={(val) => setProvisionalData({...provisionalData, previousYearTax: val})}
                  prefix={symbol}
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="1st Payment Made (Aug)"
                    id="firstPayment"
                    value={provisionalData.firstPayment}
                    onChange={(val) => setProvisionalData({...provisionalData, firstPayment: val})}
                    prefix={symbol}
                  />
                  <InputField
                    label="2nd Payment Made (Feb)"
                    id="secondPayment"
                    value={provisionalData.secondPayment}
                    onChange={(val) => setProvisionalData({...provisionalData, secondPayment: val})}
                    prefix={symbol}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-orange-500/10 to-navy-900 border-orange-500/30">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Provisional Tax Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <p className="text-sm text-orange-400">Estimated Annual Tax</p>
                    <p className="text-3xl font-bold text-orange-400">{formatCurrency(provisionalResults.estimatedTax)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-navy-800/50 rounded-lg">
                      <p className="text-sm text-slate-400">Recommended 1st Payment</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(provisionalResults.recommendedFirst)}</p>
                      <p className="text-xs text-slate-500">Due: End of August</p>
                    </div>
                    <div className="p-4 bg-navy-800/50 rounded-lg">
                      <p className="text-sm text-slate-400">Recommended 2nd Payment</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(provisionalResults.recommendedSecond)}</p>
                      <p className="text-xs text-slate-500">Due: End of February</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total Paid to Date</span>
                      <span className="text-white">{formatCurrency(provisionalResults.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Remaining Balance</span>
                      <span className={provisionalResults.remaining > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                        {formatCurrency(provisionalResults.remaining)}
                      </span>
                    </div>
                  </div>

                  {provisionalResults.underpayment > 0 && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <span className="text-red-400 font-medium">Underpayment Warning</span>
                      </div>
                      <p className="text-sm text-slate-300">
                        Estimated penalty if underpaid: {formatCurrency(provisionalResults.penaltyEstimate)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-blue-500/10 border-blue-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-400 mb-1">Provisional Tax Deadlines</h4>
                      <ul className="text-sm text-slate-300 space-y-1">
                        <li>• 1st Payment: End of August (6 months into tax year)</li>
                        <li>• 2nd Payment: End of February (year end)</li>
                        <li>• 3rd Payment: Within 7 months after year end (if needed)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* IRP5 Storage */}
        <TabsContent value="irp5" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Add New IRP5 */}
            <Card className="bg-navy-900/60 border-navy-700">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-emerald-400" />
                  Add IRP5 Record
                </CardTitle>
                <CardDescription>Store your IRP5 tax certificate details securely</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Tax Year</Label>
                    <Select 
                      value={newIrp5.taxYear} 
                      onValueChange={(val) => setNewIrp5({...newIrp5, taxYear: val})}
                    >
                      <SelectTrigger className="bg-navy-800 border-navy-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2025/2026">2025/2026</SelectItem>
                        <SelectItem value="2024/2025">2024/2025</SelectItem>
                        <SelectItem value="2023/2024">2023/2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Employer Name</Label>
                    <Input
                      value={newIrp5.employer}
                      onChange={(e) => setNewIrp5({...newIrp5, employer: e.target.value})}
                      className="bg-navy-800 border-navy-600 text-white"
                      placeholder="Company name"
                    />
                  </div>
                </div>

                <InputField
                  label="Gross Income (Code 3601/3697)"
                  id="irp5GrossIncome"
                  value={newIrp5.grossIncome}
                  onChange={(val) => setNewIrp5({...newIrp5, grossIncome: val})}
                  prefix={symbol}
                />

                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="PAYE Deducted (Code 4102)"
                    id="irp5Paye"
                    value={newIrp5.paye}
                    onChange={(val) => setNewIrp5({...newIrp5, paye: val})}
                    prefix={symbol}
                  />
                  <InputField
                    label="UIF Deducted (Code 4141)"
                    id="irp5Uif"
                    value={newIrp5.uif}
                    onChange={(val) => setNewIrp5({...newIrp5, uif: val})}
                    prefix={symbol}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Pension/RA Contributions (Code 4001/4003)"
                    id="irp5Pension"
                    value={newIrp5.pensionContributions}
                    onChange={(val) => setNewIrp5({...newIrp5, pensionContributions: val})}
                    prefix={symbol}
                  />
                  <InputField
                    label="Medical Aid (Code 4005)"
                    id="irp5Medical"
                    value={newIrp5.medicalAid}
                    onChange={(val) => setNewIrp5({...newIrp5, medicalAid: val})}
                    prefix={symbol}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Notes (Optional)</Label>
                  <Input
                    value={newIrp5.notes}
                    onChange={(e) => setNewIrp5({...newIrp5, notes: e.target.value})}
                    className="bg-navy-800 border-navy-600 text-white"
                    placeholder="Additional notes..."
                  />
                </div>

                <Button 
                  onClick={handleAddIrp5}
                  className="w-full bg-emerald-600 hover:bg-emerald-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add IRP5 Record
                </Button>
              </CardContent>
            </Card>

            {/* IRP5 Summary & Records */}
            <div className="space-y-6">
              {/* Totals Summary */}
              <Card className="bg-gradient-to-br from-blue-500/10 to-navy-900 border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-400" />
                    IRP5 Summary
                  </CardTitle>
                  <CardDescription>Combined totals from all stored IRP5s</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-navy-800/50 rounded-lg">
                      <p className="text-sm text-slate-400">Total Gross Income</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(irp5Totals.grossIncome)}</p>
                    </div>
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <p className="text-sm text-emerald-400">Total PAYE Paid</p>
                      <p className="text-xl font-bold text-emerald-400">{formatCurrency(irp5Totals.paye)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-navy-800/50 rounded-lg text-center">
                      <p className="text-xs text-slate-400">UIF</p>
                      <p className="text-sm font-medium text-white">{formatCurrency(irp5Totals.uif)}</p>
                    </div>
                    <div className="p-3 bg-navy-800/50 rounded-lg text-center">
                      <p className="text-xs text-slate-400">Pension/RA</p>
                      <p className="text-sm font-medium text-white">{formatCurrency(irp5Totals.pensionContributions)}</p>
                    </div>
                    <div className="p-3 bg-navy-800/50 rounded-lg text-center">
                      <p className="text-xs text-slate-400">Medical Aid</p>
                      <p className="text-sm font-medium text-white">{formatCurrency(irp5Totals.medicalAid)}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-navy-700">
                    <p className="text-sm text-slate-400">
                      <span className="text-white font-medium">{irp5Documents.length}</span> IRP5 record(s) stored
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Stored IRP5s */}
              <Card className="bg-navy-900/60 border-navy-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Stored IRP5 Records</CardTitle>
                </CardHeader>
                <CardContent>
                  {irp5Documents.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No IRP5 records stored yet</p>
                      <p className="text-sm">Add your first IRP5 to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {irp5Documents.map((doc) => (
                        <div 
                          key={doc.id}
                          className="p-4 bg-navy-800/50 rounded-lg border border-navy-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="border-blue-500/50 text-blue-400 text-xs">
                                  {doc.taxYear}
                                </Badge>
                                <span className="font-medium text-white">{doc.employer}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Gross:</span>
                                  <span className="text-white">{formatCurrency(doc.grossIncome)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">PAYE:</span>
                                  <span className="text-emerald-400">{formatCurrency(doc.paye)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Pension/RA:</span>
                                  <span className="text-white">{formatCurrency(doc.pensionContributions)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Medical:</span>
                                  <span className="text-white">{formatCurrency(doc.medicalAid)}</span>
                                </div>
                              </div>
                              {doc.notes && (
                                <p className="text-xs text-slate-500 mt-2 italic">{doc.notes}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteIrp5(doc.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* RA Tax Benefit Info */}
              <Card className="bg-emerald-500/10 border-emerald-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <PiggyBank className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-emerald-400 mb-1">RA Contribution Tax Benefit</h4>
                      <p className="text-sm text-slate-300 mb-2">
                        Retirement Annuity contributions are tax-deductible up to:
                      </p>
                      <ul className="text-sm text-slate-300 space-y-1">
                        <li>• <strong>27.5%</strong> of your taxable income, OR</li>
                        <li>• <strong>R350,000</strong> per year (whichever is lower)</li>
                      </ul>
                      <p className="text-xs text-slate-400 mt-2">
                        At a 36% marginal rate, a R100,000 RA contribution saves R36,000 in tax!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaxPlanningHub;
