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
import ReportBuilder from "@/pages/ReportBuilder";
import EmailGenerator from "@/pages/EmailGenerator";
import ComplianceNotes from "@/pages/ComplianceNotes";
import RoleSelectionModal from "@/components/RoleSelectionModal";
import { RoleGate } from "@/components/RoleGate";
import { RequestPasswordResetPage } from "@/pages/RequestPasswordResetPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { TermsOfServicePage } from "@/pages/TermsOfServicePage";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";
import { RefundPolicyPage } from "@/pages/RefundPolicyPage";
import { Toaster } from "@/components/ui/sonner";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { CalculatorGate } from "@/components/FeatureGate";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AIAdvisorButton } from "@/components/AIAdvisorChat";

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
      {isAuthenticated && <RoleSelectionModal />}
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
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
                  <Route path="/report-builder" element={<ProtectedRoute><RoleGate role="advisor"><GatedCalculator path="/report-builder"><ReportBuilder /></GatedCalculator></RoleGate></ProtectedRoute>} />
                  <Route path="/email-generator" element={<ProtectedRoute><RoleGate role="advisor"><GatedCalculator path="/email-generator"><EmailGenerator /></GatedCalculator></RoleGate></ProtectedRoute>} />
                  <Route path="/compliance-notes" element={<ProtectedRoute><RoleGate role="advisor"><GatedCalculator path="/compliance-notes"><ComplianceNotes /></GatedCalculator></RoleGate></ProtectedRoute>} />
                  
                  {/* Legal Pages - Public */}
                  <Route path="/terms" element={<TermsOfServicePage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/refund-policy" element={<RefundPolicyPage />} />
                </Routes>
              </AppLayout>
            <Toaster position="top-right" />
          </BrowserRouter>
        </div>
      </SubscriptionProvider>
    </CurrencyProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
