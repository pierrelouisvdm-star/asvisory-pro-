import React, { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
import { AuthProvider } from "@/context/AuthContext";

// Layout wrapper to conditionally show header/footer
const AppLayout = ({ children }) => {
  const location = useLocation();
  const hideLayout = location.pathname === '/auth';
  
  return (
    <>
      {!hideLayout && <Header />}
      <main className="flex-1">
        {children}
      </main>
      {!hideLayout && <Footer />}
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
                
                {/* Investment Calculators */}
                <Route path="/future-value" element={<FutureValueCalculator />} />
                <Route path="/compound-interest" element={<CompoundInterestCalculator />} />
                <Route path="/bond" element={<BondCalculator />} />
                <Route path="/car-finance" element={<CarFinanceCalculator />} />
                
                {/* Insurance & Planning */}
                <Route path="/life-insurance" element={<LifeInsuranceCalculator />} />
                <Route path="/income-disability" element={<IncomeDisabilityCalculator />} />
                <Route path="/retirement" element={<RetirementCalculator />} />
                
                {/* Personal Finance Tools */}
                <Route path="/tax-calculator" element={<TaxCalculator />} />
                <Route path="/estate-planning" element={<EstatePlanningCalculator />} />
                <Route path="/emergency-fund" element={<EmergencyFundCalculator />} />
                <Route path="/debt-payoff" element={<DebtPayoffCalculator />} />
                <Route path="/education-savings" element={<EducationSavingsCalculator />} />
                <Route path="/budget-planner" element={<BudgetPlanner />} />
                <Route path="/net-worth" element={<NetWorthTracker />} />
                <Route path="/risk-profile" element={<RiskProfileQuiz />} />
              </Routes>
            </AppLayout>
            <Toaster position="top-right" />
          </BrowserRouter>
        </div>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
