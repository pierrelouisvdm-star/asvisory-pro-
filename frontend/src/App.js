import React, { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { Toaster } from "@/components/ui/sonner";
import { CurrencyProvider } from "@/context/CurrencyContext";

function App() {
  const [isDark, setIsDark] = useState(() => {
    // Initialize from stored preference or system preference
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = stored === 'dark' || (!stored && prefersDark);
      
      // Apply class immediately to prevent flash
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
    <CurrencyProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <BrowserRouter>
          <Header isDark={isDark} setIsDark={setIsDark} />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/future-value" element={<FutureValueCalculator />} />
              <Route path="/compound-interest" element={<CompoundInterestCalculator />} />
              <Route path="/bond" element={<BondCalculator />} />
              <Route path="/car-finance" element={<CarFinanceCalculator />} />
              <Route path="/life-insurance" element={<LifeInsuranceCalculator />} />
              <Route path="/income-disability" element={<IncomeDisabilityCalculator />} />
              <Route path="/retirement" element={<RetirementCalculator />} />
            </Routes>
          </main>
          <Footer />
          <Toaster position="top-right" />
        </BrowserRouter>
      </div>
    </CurrencyProvider>
  );
}

export default App;
