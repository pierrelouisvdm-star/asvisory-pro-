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
import { Toaster } from "@/components/ui/sonner";

function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for system preference or stored preference
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (stored === 'dark' || (!stored && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

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
          </Routes>
        </main>
        <Footer />
        <Toaster position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;
