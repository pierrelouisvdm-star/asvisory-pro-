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
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/auth" element={<AuthPage />} />
                  
                  {/* Client Management */}
                  <Route path="/clients" element={<ClientsPage />} />
                  <Route path="/clients/:clientId" element={<ClientProfilePage />} />
                  <Route path="/clients/:clientId/analysis" element={<ClientProfilePage />} />
                  <Route path="/clients/:clientId/goals" element={<GoalPlannerPage />} />
                  <Route path="/clients/:clientId/meetings" element={<MeetingSchedulerPage />} />
                  <Route path="/clients/:clientId/reviews" element={<ReviewTrackerPage />} />
                  <Route path="/clients/:clientId/portfolio" element={<PortfolioTrackerPage />} />
                  
                  {/* Advanced Tools */}
                  <Route path="/cash-flow" element={<CashFlowProjector />} />
                  <Route path="/monte-carlo" element={<MonteCarloSimulator />} />
                  <Route path="/loan-comparison" element={<LoanComparisonTool />} />
                  
                  {/* Pricing & Subscription */}
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
                  
                  {/* FREE Calculators (available to all) */}
                  <Route path="/future-value" element={<FutureValueCalculator />} />
                  <Route path="/compound-interest" element={<CompoundInterestCalculator />} />
                  <Route path="/bond" element={<BondCalculator />} />
                  <Route path="/car-finance" element={<CarFinanceCalculator />} />
                  
                  {/* PAID Calculators (Standard+) */}
                  <Route path="/life-insurance" element={<GatedCalculator path="/life-insurance"><LifeInsuranceCalculator /></GatedCalculator>} />
                  <Route path="/income-disability" element={<GatedCalculator path="/income-disability"><IncomeDisabilityCalculator /></GatedCalculator>} />
                  <Route path="/retirement" element={<GatedCalculator path="/retirement"><RetirementCalculator /></GatedCalculator>} />
                  <Route path="/tax-calculator" element={<GatedCalculator path="/tax-calculator"><TaxCalculator /></GatedCalculator>} />
                  <Route path="/estate-planning" element={<GatedCalculator path="/estate-planning"><EstatePlanningCalculator /></GatedCalculator>} />
                  <Route path="/emergency-fund" element={<GatedCalculator path="/emergency-fund"><EmergencyFundCalculator /></GatedCalculator>} />
                  <Route path="/debt-payoff" element={<GatedCalculator path="/debt-payoff"><DebtPayoffCalculator /></GatedCalculator>} />
                  <Route path="/education-savings" element={<GatedCalculator path="/education-savings"><EducationSavingsCalculator /></GatedCalculator>} />
                  <Route path="/budget-planner" element={<GatedCalculator path="/budget-planner"><BudgetPlanner /></GatedCalculator>} />
                  <Route path="/net-worth" element={<GatedCalculator path="/net-worth"><NetWorthTracker /></GatedCalculator>} />
                  <Route path="/risk-profile" element={<GatedCalculator path="/risk-profile"><RiskProfileQuiz /></GatedCalculator>} />
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
