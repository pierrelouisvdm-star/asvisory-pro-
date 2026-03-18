import { test, expect } from '@playwright/test';
import { login, waitForAppReady, dismissToasts } from '../fixtures/helpers';

test.describe('Tax Hub Highlight and Income & Expense Tracker Features', () => {
  const adminEmail = 'Pierrelouisvdm@gmail.com';
  const adminPassword = 'Scorpio@57!!';

  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test.describe('Landing Page Tests (No Auth Required)', () => {
    
    test('should display "EMPOWER YOUR FINANCIAL FUTURE" tagline in hero section', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Check for the tagline
      const tagline = page.locator('p.tracking-\\[0\\.3em\\]').filter({ hasText: /EMPOWER YOUR FINANCIAL FUTURE/i });
      await expect(tagline).toBeVisible();
    });

    test('should display "Explore Tax Hub" button in hero section', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Check for the Explore Tax Hub button
      const exploreTaxHubButton = page.getByRole('link', { name: /Explore Tax Hub/i });
      await expect(exploreTaxHubButton).toBeVisible();
      
      // Verify it links to /tax-planning
      await expect(exploreTaxHubButton).toHaveAttribute('href', '/tax-planning');
    });

    test('should display Tax Hub feature section with 6 tax tools', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Scroll to the Tax Hub section
      await page.evaluate(() => window.scrollTo(0, 700));
      await page.waitForTimeout(500);
      
      // Check for the Featured: Tax Planning Hub badge
      const featuredBadge = page.getByText('Featured: Tax Planning Hub');
      await expect(featuredBadge).toBeVisible();
      
      // Check for the section title
      const sectionTitle = page.locator('h2').filter({ hasText: /Tax Planning Suite/i });
      await expect(sectionTitle).toBeVisible();
      
      // Verify all 6 tax tools are listed
      const taxTools = [
        'Income Tax Calculator',
        'Capital Gains Tax',
        'Medical Aid Credits',
        'RA Tax Savings',
        'Provisional Tax',
        'Income & Expense Tracker'
      ];
      
      for (const tool of taxTools) {
        const toolElement = page.locator('p').filter({ hasText: tool }).first();
        await expect(toolElement).toBeVisible();
      }
    });

    test('should display R249/month pricing in hero section', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      const pricingText = page.locator('p').filter({ hasText: /R249\/month/i }).first();
      await expect(pricingText).toBeVisible();
    });
  });

  test.describe('Auth Page Tests', () => {

    test('should display Free tier with R0/forever and 4 calculators', async ({ page }) => {
      await page.goto('/auth', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Check for Free tier card
      const freeTierName = page.locator('h3').filter({ hasText: 'Free' });
      await expect(freeTierName).toBeVisible();
      
      // Check for R0/forever price
      const freePrice = page.locator('text=R0');
      await expect(freePrice.first()).toBeVisible();
      const foreverText = page.locator('text=/forever');
      await expect(foreverText.first()).toBeVisible();
      
      // Check for the 4 free calculators
      const freeCalculators = [
        'TFSA Calculator',
        'Bond/Mortgage Calculator',
        'Future Value Calculator',
        'Compound Interest Calculator'
      ];
      
      for (const calc of freeCalculators) {
        const calcElement = page.locator('li').filter({ hasText: calc });
        await expect(calcElement.first()).toBeVisible();
      }
    });

    test('should display Premium tier with R249/month and all features', async ({ page }) => {
      await page.goto('/auth', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Check for Premium tier
      const premiumTierName = page.locator('h3').filter({ hasText: 'Premium' });
      await expect(premiumTierName).toBeVisible();
      
      // Check for R249/month price
      const premiumPrice = page.locator('text=R249');
      await expect(premiumPrice.first()).toBeVisible();
      
      const monthText = page.locator('text=/month');
      await expect(monthText.first()).toBeVisible();
      
      // Check for premium features
      const premiumFeatures = [
        'All 19 Financial Calculators',
        'PDF Reports',
        'Live Market Tracker',
        'AI Assistant',
        'Advanced Tools'
      ];
      
      for (const feature of premiumFeatures) {
        const featureElement = page.locator('li').filter({ hasText: feature });
        await expect(featureElement.first()).toBeVisible();
      }
    });
  });

  test.describe('Dashboard Tests (Auth Required)', () => {

    test.beforeEach(async ({ page }) => {
      await login(page, adminEmail, adminPassword);
      await page.waitForTimeout(2000);
    });

    test('should display Tax Planning Hub with NEW and Featured badges in Dashboard', async ({ page }) => {
      // Wait for dashboard to load
      await expect(page.getByTestId('dashboard')).toBeVisible();
      
      // Scroll to Personal Finance Tools section
      await page.evaluate(() => window.scrollTo(0, 3000));
      await page.waitForTimeout(500);
      
      // Find the Tax Planning Hub card
      const taxPlanningCard = page.getByTestId('calculator-card-tax-planning');
      await expect(taxPlanningCard).toBeVisible();
      
      // Check for NEW badge
      const newBadge = taxPlanningCard.locator('text=NEW');
      await expect(newBadge).toBeVisible();
      
      // Check for green/emerald styling indicating Featured
      const cardTitle = taxPlanningCard.locator('h3');
      await expect(cardTitle).toHaveText('Tax Planning Hub');
      // Featured cards have emerald text color
      await expect(cardTitle).toHaveClass(/text-emerald/);
    });

    test('should display Income & Expense Tracker with NEW badge in Dashboard', async ({ page }) => {
      // Wait for dashboard to load
      await expect(page.getByTestId('dashboard')).toBeVisible();
      
      // Scroll to Personal Finance Tools section
      await page.evaluate(() => window.scrollTo(0, 3000));
      await page.waitForTimeout(500);
      
      // Find the Income & Expense Tracker card
      const trackerCard = page.getByTestId('calculator-card-income-expense-tracker');
      await expect(trackerCard).toBeVisible();
      
      // Check for NEW badge
      const newBadge = trackerCard.locator('text=NEW');
      await expect(newBadge).toBeVisible();
      
      // Check card title
      const cardTitle = trackerCard.locator('h3');
      await expect(cardTitle).toHaveText('Income & Expense Tracker');
    });

    test('should navigate to Income & Expense Tracker page', async ({ page }) => {
      // Navigate directly to the tracker page
      await page.goto('/income-expense-tracker', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      
      // Check for the page title
      const pageTitle = page.locator('h1').filter({ hasText: 'Income & Expense Tracker' });
      await expect(pageTitle).toBeVisible();
      
      // Check for the data-testid
      await expect(page.getByTestId('income-expense-tracker')).toBeVisible();
    });

    test('Income & Expense Tracker should have budget vs actual comparison', async ({ page }) => {
      await page.goto('/income-expense-tracker', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      
      // Check for Budget vs Actual section
      const budgetVsActual = page.locator('text=Budget vs Actual');
      await expect(budgetVsActual.first()).toBeVisible();
    });

    test('Income & Expense Tracker should have tax-deductible expense tracking', async ({ page }) => {
      await page.goto('/income-expense-tracker', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      
      // Check for Tax Deductible section
      const taxDeductible = page.locator('text=Tax Deductible').first();
      await expect(taxDeductible).toBeVisible();
      
      // Check for Tax Deductible Expenses section
      const taxDeductibleExpenses = page.locator('text=Tax Deductible Expenses');
      await expect(taxDeductibleExpenses.first()).toBeVisible();
    });

    test('Income & Expense Tracker should have tabs for different views', async ({ page }) => {
      await page.goto('/income-expense-tracker', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      
      // Check for tabs
      const overviewTab = page.getByRole('tab', { name: /Overview/i });
      await expect(overviewTab).toBeVisible();
      
      const addTransactionTab = page.getByRole('tab', { name: /Add Transaction/i });
      await expect(addTransactionTab).toBeVisible();
      
      const transactionsTab = page.getByRole('tab', { name: /Transactions/i });
      await expect(transactionsTab).toBeVisible();
      
      const budgetTab = page.getByRole('tab', { name: /Budget/i });
      await expect(budgetTab).toBeVisible();
    });

    test('Income & Expense Tracker should have month selector', async ({ page }) => {
      await page.goto('/income-expense-tracker', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      
      // Check for month selector - should show current month
      const monthSelector = page.locator('button').filter({ hasText: /March 2026|2026/i });
      await expect(monthSelector.first()).toBeVisible();
    });

    test('Income & Expense Tracker should display summary cards', async ({ page }) => {
      await page.goto('/income-expense-tracker', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      
      // Check for summary cards
      const totalIncome = page.locator('text=Total Income');
      await expect(totalIncome.first()).toBeVisible();
      
      const totalExpenses = page.locator('text=Total Expenses');
      await expect(totalExpenses.first()).toBeVisible();
      
      const netIncome = page.locator('text=Net Income');
      await expect(netIncome.first()).toBeVisible();
      
      const taxDeductible = page.locator('p').filter({ hasText: 'Tax Deductible' });
      await expect(taxDeductible.first()).toBeVisible();
    });

    test('Income & Expense Tracker should have savings rate display', async ({ page }) => {
      await page.goto('/income-expense-tracker', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      
      // Check for savings rate
      const savingsRate = page.locator('text=Savings Rate');
      await expect(savingsRate.first()).toBeVisible();
    });
  });

  test.describe('Route Protection Tests', () => {

    test('Income & Expense Tracker route should require authentication', async ({ page }) => {
      // Try to access the tracker page without being logged in
      await page.goto('/income-expense-tracker', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      // Should be redirected to auth page or show landing page
      const currentUrl = page.url();
      
      // Should NOT show the tracker if not authenticated
      // It should show either auth page or landing page
      const trackerVisible = await page.getByTestId('income-expense-tracker').isVisible().catch(() => false);
      
      if (trackerVisible) {
        // If we see the tracker, we need to verify we're authenticated
        test.fail(true, 'Income & Expense Tracker should not be accessible without authentication');
      }
    });
  });
});
