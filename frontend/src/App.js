import React, { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LandingPage } from "@/pages/LandingPage";
import { Dashboard } from "@/pages/Dashboard";
import { FutureValueCalculator } from "@/pages/FutureValueCalculator";
import { CompoundInterestCalculator } from "@/pages/CompoundInterestCalculator";
import { BondCalculator } from "@/pages/BondCalculator";
import { CarFinanceCalculator } from "@/pages/CarFinanceCalculator";
import { LifeInsuranceCalculator } from "@/pages/LifeInsuranceCalculator";
import { IncomeDisabilityCalculator } from "@/pages/IncomeDisabilityCalculator";
import { RetirementCalculator } from "@/pages/RetirementCalculator";
import { TaxCalculator } from "@/pages/TaxCalculator";
import { EstatePlanningCalculator } from "@/pages/EstatePlanningCalculator";
import { EmergencyFundCalculator } from "@/pages/EmergencyFundCalculator";
import { DebtPayoffCalculator } from "@/pages/DebtPayoffCalculator";
import { EducationSavingsCalculator } from "@/pages/EducationSavingsCalculator";
import { BudgetPlanner } from "@/pages/BudgetPlanner";
import { NetWorthTracker } from "@/pages/NetWorthTracker";
import { RiskProfileQuiz } from "@/pages/RiskProfileQuiz";
import { AuthPage } from "@/pages/AuthPage";
import { CashFlowProjector } from "@/pages/CashFlowProjector";
import { MonteCarloSimulator } from "@/pages/MonteCarloSimulator";
import { LoanComparisonTool } from "@/pages/LoanComparisonTool";
import { PricingPage } from "@/pages/PricingPage";
import { PaymentSuccessPage } from "@/pages/PaymentSuccessPage";
import { SubscriptionSuccessPage } from "@/pages/SubscriptionSuccessPage";
import { AnalyticsDashboard } from "@/pages/AnalyticsDashboard";
import { LivingAnnuityCalculator } from "@/pages/LivingAnnuityCalculator";
import { RetirementTaxCalculator } from "@/pages/RetirementTaxCalculator";
import TaxDirectiveSimulator from "@/pages/TaxDirectiveSimulator";
import FinancialLiteracyQuiz from "@/pages/FinancialLiteracyQuiz";
import SecurityPage from "@/pages/SecurityPage";
import TaxPlanningHub from "@/pages/TaxPlanningHub";
import DocumentReader from "@/pages/DocumentReader";
import FeeComparisonCalculator from "@/pages/FeeComparisonCalculator";
import TFSACalculator from "@/pages/TFSACalculator";
import IncomeExpenseTracker from "@/pages/IncomeExpenseTracker";
import MarketInsights from "@/pages/MarketInsights";
import TaxCalculatorUS from "@/pages/calculators/TaxCalculatorUS";
import Calculator401k from "@/pages/calculators/Calculator401k";
import RothIRACalculator from "@/pages/calculators/RothIRACalculator";
import SocialSecurityCalculator from "@/pages/calculators/SocialSecurityCalculator";
import HSACalculator from "@/pages/calculators/HSACalculator";
import Calculator529 from "@/pages/calculators/Calculator529";
import FIRECalculator from "@/pages/calculators/FIRECalculator";
import StudentLoanCalculator from "@/pages/calculators/StudentLoanCalculator";
import SelfEmployedTaxCalculator from "@/pages/calculators/SelfEmployedTaxCalculator";
import CapitalGainsTaxCalculator from "@/pages/calculators/CapitalGainsTaxCalculator";
import RMDCalculator from "@/pages/calculators/RMDCalculator";
import RothConversionCalculator from "@/pages/calculators/RothConversionCalculator";
import PaycheckCalculator from "@/pages/calculators/PaycheckCalculator";
import MedicareIRMAA from "@/pages/calculators/MedicareIRMAA";
import W4Optimizer from "@/pages/calculators/W4Optimizer";
import HomeAffordabilityCalculator from "@/pages/calculators/HomeAffordabilityCalculator";
import RentVsBuyCalculator from "@/pages/calculators/RentVsBuyCalculator";
import RSUCalculator from "@/pages/calculators/RSUCalculator";
import ACASubsidyCalculator from "@/pages/calculators/ACASubsidyCalculator";
import MegaBackdoorRothCalculator from "@/pages/calculators/MegaBackdoorRothCalculator";
import FreelancerRateCalculator from "@/pages/calculators/FreelancerRateCalculator";
import DCAvsLumpSumCalculator from "@/pages/calculators/DCAvsLumpSumCalculator";
import AMTCalculator from "@/pages/calculators/AMTCalculator";
import FinancialIndependenceScore from "@/pages/calculators/FinancialIndependenceScore";
import USTaxCalendar from "@/pages/calculators/USTaxCalendar";
import SavingsComparisonCalculator from "@/pages/calculators/SavingsComparisonCalculator";
import TaxSavingsFinder from "@/pages/calculators/TaxSavingsFinder";
import TaxComparison2025 from "@/pages/calculators/TaxComparison2025";
import PublicToolsPage from "@/pages/PublicToolsPage";
import { RequestPasswordResetPage } from "@/pages/RequestPasswordResetPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { Toaster } from "@/components/ui/sonner";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { JurisdictionProvider } from "@/context/JurisdictionContext";
import { CalculatorGate } from "@/components/FeatureGate";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AIAdvisorButton } from "@/components/AIAdvisorChat";
import { HelmetProvider } from "react-helmet-async";

// Wrap a calculator with feature gate
const GatedCalculator = ({ path, children }) => (
  <CalculatorGate path={path}>{children}</CalculatorGate>
);

// Show landing page for non-authenticated users, dashboard for authenticated
const AuthenticatedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <LandingPage />;
  }
  
  return children;
};

// Layout wrapper to conditionally show header/footer
const AppLayout = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isPublicPage = ['/', '/auth', '/pricing'].includes(location.pathname) || location.pathname.startsWith('/subscription');
  const isPasswordResetPage = location.pathname === '/request-password-reset' || location.pathname === '/reset-password';
  const hideLayout = location.pathname === '/auth' || isPasswordResetPage || (location.pathname === '/' && !isAuthenticated);
  
  return (
    <>
      {!hideLayout && <Header />}
      <main className="flex-1">
        {children}
      </main>
      {!hideLayout && <Footer />}
      {isAuthenticated && <AIAdvisorButton />}
    </>
  );
};

function App() {
  return (
    <HelmetProvider>
    <ThemeProvider>
      <AuthProvider>
        <JurisdictionProvider>
          <CurrencyProvider>
            <SubscriptionProvider>
              <div className="min-h-screen flex flex-col bg-background">
                <BrowserRouter>
                  <AppLayout>
                    <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<AuthenticatedRoute><Dashboard /></AuthenticatedRoute>} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/welcome" element={<LandingPage />} />
                  
                    {/* Pricing - accessible to all but shows different content */}
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/payment/success" element={<PaymentSuccessPage />} />
                  <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
                  
                  {/* Protected Routes - require authentication */}
                  
                  {/* Advanced Tools - require auth */}
                  <Route path="/cash-flow" element={<ProtectedRoute><CashFlowProjector /></ProtectedRoute>} />
                  <Route path="/monte-carlo" element={<ProtectedRoute><MonteCarloSimulator /></ProtectedRoute>} />
                  <Route path="/loan-comparison" element={<ProtectedRoute><LoanComparisonTool /></ProtectedRoute>} />
                  
                  {/* FREE Calculators (require auth but available to all tiers) */}
                  <Route path="/future-value" element={<ProtectedRoute><FutureValueCalculator /></ProtectedRoute>} />
                  <Route path="/compound-interest" element={<ProtectedRoute><CompoundInterestCalculator /></ProtectedRoute>} />
                  <Route path="/bond" element={<ProtectedRoute><BondCalculator /></ProtectedRoute>} />
                  <Route path="/car-finance" element={<ProtectedRoute><CarFinanceCalculator /></ProtectedRoute>} />
                  
                  {/* PAID Calculators (Standard+) */}
                  <Route path="/life-insurance" element={<ProtectedRoute><GatedCalculator path="/life-insurance"><LifeInsuranceCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/income-disability" element={<ProtectedRoute><GatedCalculator path="/income-disability"><IncomeDisabilityCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/retirement" element={<ProtectedRoute><GatedCalculator path="/retirement"><RetirementCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/living-annuity" element={<ProtectedRoute><GatedCalculator path="/living-annuity"><LivingAnnuityCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/retirement-tax" element={<ProtectedRoute><GatedCalculator path="/retirement-tax"><RetirementTaxCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/tax-directive" element={<ProtectedRoute><GatedCalculator path="/tax-directive"><TaxDirectiveSimulator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/tax-planning" element={<ProtectedRoute><GatedCalculator path="/tax-planning"><TaxPlanningHub /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/tax-calculator" element={<ProtectedRoute><GatedCalculator path="/tax-calculator"><TaxCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/estate-planning" element={<ProtectedRoute><GatedCalculator path="/estate-planning"><EstatePlanningCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/emergency-fund" element={<ProtectedRoute><GatedCalculator path="/emergency-fund"><EmergencyFundCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/debt-payoff" element={<ProtectedRoute><GatedCalculator path="/debt-payoff"><DebtPayoffCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/education-savings" element={<ProtectedRoute><GatedCalculator path="/education-savings"><EducationSavingsCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/budget-planner" element={<ProtectedRoute><GatedCalculator path="/budget-planner"><BudgetPlanner /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/net-worth" element={<ProtectedRoute><GatedCalculator path="/net-worth"><NetWorthTracker /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/risk-profile" element={<ProtectedRoute><GatedCalculator path="/risk-profile"><RiskProfileQuiz /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/financial-literacy" element={<ProtectedRoute><GatedCalculator path="/financial-literacy"><FinancialLiteracyQuiz /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/security" element={<ProtectedRoute><SecurityPage /></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
                  <Route path="/document-reader" element={<ProtectedRoute><GatedCalculator path="/document-reader"><DocumentReader /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/fee-comparison" element={<ProtectedRoute><GatedCalculator path="/fee-comparison"><FeeComparisonCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/tfsa-calculator" element={<ProtectedRoute><GatedCalculator path="/tfsa-calculator"><TFSACalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/income-expense-tracker" element={<ProtectedRoute><IncomeExpenseTracker /></ProtectedRoute>} />
                  <Route path="/market-insights" element={<ProtectedRoute><MarketInsights /></ProtectedRoute>} />
                  
                  {/* US Calculators */}
                  <Route path="/us/tax-calculator" element={<ProtectedRoute><GatedCalculator path="/us/tax-calculator"><TaxCalculatorUS /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/401k-calculator" element={<ProtectedRoute><GatedCalculator path="/us/401k-calculator"><Calculator401k /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/roth-ira" element={<ProtectedRoute><GatedCalculator path="/us/roth-ira"><RothIRACalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/social-security" element={<ProtectedRoute><GatedCalculator path="/us/social-security"><SocialSecurityCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/hsa" element={<ProtectedRoute><GatedCalculator path="/us/hsa"><HSACalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/529" element={<ProtectedRoute><GatedCalculator path="/us/529"><Calculator529 /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/fire-calculator" element={<ProtectedRoute><GatedCalculator path="/us/fire-calculator"><FIRECalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/student-loan" element={<ProtectedRoute><GatedCalculator path="/us/student-loan"><StudentLoanCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/self-employed" element={<ProtectedRoute><GatedCalculator path="/us/self-employed"><SelfEmployedTaxCalculator /></GatedCalculator></ProtectedRoute>} />
                  {/* US Calculators — Batch 2 */}
                  <Route path="/us/capital-gains" element={<ProtectedRoute><GatedCalculator path="/us/capital-gains"><CapitalGainsTaxCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/rmd" element={<ProtectedRoute><GatedCalculator path="/us/rmd"><RMDCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/roth-conversion" element={<ProtectedRoute><GatedCalculator path="/us/roth-conversion"><RothConversionCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/paycheck" element={<ProtectedRoute><GatedCalculator path="/us/paycheck"><PaycheckCalculator /></GatedCalculator></ProtectedRoute>} />
                  {/* US Calculators — Tier 1 */}
                  <Route path="/us/irmaa" element={<ProtectedRoute><GatedCalculator path="/us/irmaa"><MedicareIRMAA /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/w4-optimizer" element={<ProtectedRoute><GatedCalculator path="/us/w4-optimizer"><W4Optimizer /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/home-affordability" element={<ProtectedRoute><GatedCalculator path="/us/home-affordability"><HomeAffordabilityCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/rent-vs-buy" element={<ProtectedRoute><GatedCalculator path="/us/rent-vs-buy"><RentVsBuyCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/rsu-calculator" element={<ProtectedRoute><GatedCalculator path="/us/rsu-calculator"><RSUCalculator /></GatedCalculator></ProtectedRoute>} />
                  {/* US Calculators — Tier 2 */}
                  <Route path="/us/aca-subsidy" element={<ProtectedRoute><GatedCalculator path="/us/aca-subsidy"><ACASubsidyCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/mega-backdoor-roth" element={<ProtectedRoute><GatedCalculator path="/us/mega-backdoor-roth"><MegaBackdoorRothCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/freelancer-rate" element={<ProtectedRoute><GatedCalculator path="/us/freelancer-rate"><FreelancerRateCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/dca-vs-lump-sum" element={<ProtectedRoute><GatedCalculator path="/us/dca-vs-lump-sum"><DCAvsLumpSumCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/amt-calculator" element={<ProtectedRoute><GatedCalculator path="/us/amt-calculator"><AMTCalculator /></GatedCalculator></ProtectedRoute>} />
                  {/* US Calculators — Tier 3 */}
                  <Route path="/us/fi-score" element={<ProtectedRoute><FinancialIndependenceScore /></ProtectedRoute>} />
                  <Route path="/us/tax-calendar" element={<ProtectedRoute><USTaxCalendar /></ProtectedRoute>} />
                  <Route path="/us/savings-comparison" element={<ProtectedRoute><GatedCalculator path="/us/savings-comparison"><SavingsComparisonCalculator /></GatedCalculator></ProtectedRoute>} />
                  {/* Growth & Viral Tools */}
                  <Route path="/us/tax-savings-finder" element={<ProtectedRoute><GatedCalculator path="/us/tax-savings-finder"><TaxSavingsFinder /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/us/tax-comparison-2025" element={<ProtectedRoute><TaxComparison2025 /></ProtectedRoute>} />
                  {/* Public landing page — no login required */}
                  <Route path="/tools" element={<PublicToolsPage />} />
                </Routes>
              </AppLayout>
              <Toaster position="top-right" />
            </BrowserRouter>
          </div>
        </SubscriptionProvider>
      </CurrencyProvider>
      </JurisdictionProvider>
    </AuthProvider>
    </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
