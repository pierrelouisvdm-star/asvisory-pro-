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
import { ClientsPage } from "@/pages/ClientsPage";
import { ClientProfilePage } from "@/pages/ClientProfilePage";
import { GoalPlannerPage } from "@/pages/GoalPlannerPage";
import { MeetingSchedulerPage } from "@/pages/MeetingSchedulerPage";
import { ReviewTrackerPage } from "@/pages/ReviewTrackerPage";
import { PortfolioTrackerPage } from "@/pages/PortfolioTrackerPage";
import { CashFlowProjector } from "@/pages/CashFlowProjector";
import { MonteCarloSimulator } from "@/pages/MonteCarloSimulator";
import { LoanComparisonTool } from "@/pages/LoanComparisonTool";
import { PricingPage } from "@/pages/PricingPage";
import { SubscriptionSuccessPage } from "@/pages/SubscriptionSuccessPage";
import { Toaster } from "@/components/ui/sonner";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
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
  const hideLayout = location.pathname === '/auth' || (location.pathname === '/' && !isAuthenticated);
  
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
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = stored === 'dark' || (!stored && prefersDark);
      
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      }
      return shouldBeDark;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
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
                  <Route path="/welcome" element={<LandingPage />} />
                  
                  {/* Pricing - accessible to all but shows different content */}
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
                  
                  {/* Protected Routes - require authentication */}
                  {/* Client Management */}
                  <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
                  <Route path="/clients/:clientId" element={<ProtectedRoute><ClientProfilePage /></ProtectedRoute>} />
                  <Route path="/clients/:clientId/analysis" element={<ProtectedRoute><ClientProfilePage /></ProtectedRoute>} />
                  <Route path="/clients/:clientId/goals" element={<ProtectedRoute><GoalPlannerPage /></ProtectedRoute>} />
                  <Route path="/clients/:clientId/meetings" element={<ProtectedRoute><MeetingSchedulerPage /></ProtectedRoute>} />
                  <Route path="/clients/:clientId/reviews" element={<ProtectedRoute><ReviewTrackerPage /></ProtectedRoute>} />
                  <Route path="/clients/:clientId/portfolio" element={<ProtectedRoute><PortfolioTrackerPage /></ProtectedRoute>} />
                  
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
                  <Route path="/tax-calculator" element={<ProtectedRoute><GatedCalculator path="/tax-calculator"><TaxCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/estate-planning" element={<ProtectedRoute><GatedCalculator path="/estate-planning"><EstatePlanningCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/emergency-fund" element={<ProtectedRoute><GatedCalculator path="/emergency-fund"><EmergencyFundCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/debt-payoff" element={<ProtectedRoute><GatedCalculator path="/debt-payoff"><DebtPayoffCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/education-savings" element={<ProtectedRoute><GatedCalculator path="/education-savings"><EducationSavingsCalculator /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/budget-planner" element={<ProtectedRoute><GatedCalculator path="/budget-planner"><BudgetPlanner /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/net-worth" element={<ProtectedRoute><GatedCalculator path="/net-worth"><NetWorthTracker /></GatedCalculator></ProtectedRoute>} />
                  <Route path="/risk-profile" element={<ProtectedRoute><GatedCalculator path="/risk-profile"><RiskProfileQuiz /></GatedCalculator></ProtectedRoute>} />
                </Routes>
              </AppLayout>
              <Toaster position="top-right" />
            </BrowserRouter>
          </div>
        </SubscriptionProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
