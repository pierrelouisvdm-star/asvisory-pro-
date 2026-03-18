import { test, expect } from '@playwright/test';
import { waitForAppReady, dismissToasts } from '../fixtures/helpers';

/**
 * Test suite to verify client management features have been removed from AdvisoryPro
 * The application now targets individual investors instead of financial advisors
 */
test.describe('Client Management Removal Verification', () => {
  
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test.describe('Pricing Page - No Client Features', () => {
    
    test('pricing page should NOT show "Unlimited Client Management" in premium features', async ({ page }) => {
      await page.goto('/pricing');
      await waitForAppReady(page);
      
      // Get all text content on the pricing page
      const pageContent = await page.locator('body').textContent();
      
      // Verify no client-related premium features
      expect(pageContent?.toLowerCase()).not.toContain('unlimited client');
      expect(pageContent?.toLowerCase()).not.toContain('client management');
      
      // Take screenshot for verification
      await page.screenshot({ path: 'pricing-no-clients.jpeg', quality: 20 });
    });

    test('pricing page free tier should NOT show "Up to 3 Clients" feature', async ({ page }) => {
      await page.goto('/pricing');
      await waitForAppReady(page);
      
      // Check the free plan card specifically
      const pageContent = await page.locator('body').textContent();
      
      // Should not contain client limits
      expect(pageContent?.toLowerCase()).not.toContain('up to 3 clients');
      expect(pageContent?.toLowerCase()).not.toContain('3 clients');
    });

    test('pricing page premium features should list individual investor features', async ({ page }) => {
      await page.goto('/pricing');
      await waitForAppReady(page);
      
      // Verify premium features that should be present
      const pageContent = await page.locator('body').textContent();
      
      // These are the expected premium features
      expect(pageContent).toContain('All 19 Financial Calculators');
      expect(pageContent).toContain('PDF Report Generation');
      expect(pageContent).toContain('Advanced Analysis Tools');
      expect(pageContent).toContain('Live Market Tracker');
      expect(pageContent).toContain('Goal Planner');
      expect(pageContent).toContain('Meeting Scheduler');
      expect(pageContent).toContain('Portfolio Tracker');
    });
  });

  test.describe('Header Navigation - No Clients Link', () => {
    
    test('header should NOT have a Clients navigation link', async ({ page }) => {
      await page.goto('/pricing');
      await waitForAppReady(page);
      
      // Check header navigation area
      const header = page.locator('header');
      await expect(header).toBeVisible();
      
      // Get header text content
      const headerContent = await header.textContent();
      
      // Should NOT contain Clients link
      expect(headerContent?.toLowerCase()).not.toContain('clients');
      
      // Verify expected navigation links ARE present
      expect(headerContent).toContain('Dashboard');
      expect(headerContent).toContain('Analytics');
      expect(headerContent).toContain('Calculators');
      expect(headerContent).toContain('AI Docs');
      expect(headerContent).toContain('Tax Hub');
      
      await page.screenshot({ path: 'header-no-clients.jpeg', quality: 20 });
    });

    test('mobile menu should NOT have a Clients navigation link', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/pricing');
      await waitForAppReady(page);
      
      // Find and click mobile menu button
      const menuButton = page.locator('header button').filter({ has: page.locator('svg') }).last();
      await menuButton.click();
      
      // Wait for mobile menu to open
      await page.waitForTimeout(500);
      
      // Get all visible nav content
      const pageContent = await page.locator('body').textContent();
      
      // Mobile nav should NOT contain Clients
      expect(pageContent?.toLowerCase()).not.toContain('clients');
      
      await page.screenshot({ path: 'mobile-menu-no-clients.jpeg', quality: 20 });
    });
  });

  test.describe('Auth Page - No Client Features', () => {
    
    test('auth page should NOT show "Unlimited Clients" in premium features', async ({ page }) => {
      await page.goto('/auth');
      await waitForAppReady(page);
      
      // Get page content
      const pageContent = await page.locator('body').textContent();
      
      // Should NOT contain client-related features
      expect(pageContent?.toLowerCase()).not.toContain('unlimited clients');
      expect(pageContent?.toLowerCase()).not.toContain('client management');
      
      // Should contain expected premium features
      expect(pageContent).toContain('All 19 Financial Calculators');
      expect(pageContent).toContain('PDF Reports');
      expect(pageContent).toContain('Live Market Tracker');
      expect(pageContent).toContain('AI Assistant');
      
      await page.screenshot({ path: 'auth-page-no-clients.jpeg', quality: 20 });
    });

    test('auth page premium features list should show individual investor features', async ({ page }) => {
      await page.goto('/auth');
      await waitForAppReady(page);
      
      // Check the Premium Features Include section
      const pageContent = await page.locator('body').textContent();
      
      // Expected features
      expect(pageContent).toContain('19 Calculators');
      expect(pageContent).toContain('PDF Reports');
      expect(pageContent).toContain('Live Market Data');
      expect(pageContent).toContain('AI Assistant');
      expect(pageContent).toContain('Priority Support');
      
      // Should NOT have Users/Clients icon label
      expect(pageContent?.toLowerCase()).not.toContain('unlimited client');
    });
  });

  test.describe('Dashboard CTA Section - Updated Messaging (requires login)', () => {
    
    test('dashboard CTA should use "take control of your finances" messaging', async ({ page }) => {
      // Navigate to auth page
      await page.goto('/auth');
      await page.waitForLoadState('domcontentloaded');
      
      // Click the Sign In tab
      await page.getByTestId('login-tab').click();
      await page.waitForTimeout(500);
      
      // Fill in credentials
      await page.getByTestId('login-email-input').fill('Pierrelouisvdm@gmail.com');
      await page.getByTestId('login-password-input').fill('Scorpio@57!!');
      
      // Click sign in
      await page.getByTestId('login-submit-btn').click();
      
      // Wait for successful login and dashboard load
      await page.waitForURL('/');
      await page.waitForLoadState('domcontentloaded');
      
      // Wait for dashboard-specific element to confirm we're on authenticated dashboard
      await expect(page.getByTestId('dashboard')).toBeVisible();
      
      // Scroll to CTA section
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      // Get page content  
      const pageContent = await page.locator('body').textContent();
      
      // Should have the updated messaging
      expect(pageContent).toContain('Ready to take control of your finances');
      
      // Should NOT have client presentations messaging
      expect(pageContent?.toLowerCase()).not.toContain('client presentations');
      expect(pageContent?.toLowerCase()).not.toContain('elevate your client');
      
      await page.screenshot({ path: 'dashboard-cta-updated.jpeg', quality: 20 });
    });

    test('dashboard features section should say "Professional Tools" not "Built for Advisors"', async ({ page }) => {
      // Navigate to auth page
      await page.goto('/auth');
      await page.waitForLoadState('domcontentloaded');
      
      // Click the Sign In tab  
      await page.getByTestId('login-tab').click();
      await page.waitForTimeout(500);
      
      // Fill in credentials
      await page.getByTestId('login-email-input').fill('Pierrelouisvdm@gmail.com');
      await page.getByTestId('login-password-input').fill('Scorpio@57!!');
      
      // Click sign in
      await page.getByTestId('login-submit-btn').click();
      
      // Wait for successful login and dashboard load
      await page.waitForURL('/');
      await page.waitForLoadState('domcontentloaded');
      
      // Wait for dashboard-specific element
      await expect(page.getByTestId('dashboard')).toBeVisible();
      
      // Scroll to find Features section (before CTA)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.9));
      await page.waitForTimeout(500);
      
      // Get page content
      const pageContent = await page.locator('body').textContent();
      
      // Should have updated title
      expect(pageContent).toContain('Professional Tools');
      
      // Should NOT have old advisor-focused title
      expect(pageContent?.toLowerCase()).not.toContain('built for advisors');
      
      await page.screenshot({ path: 'dashboard-professional-tools.jpeg', quality: 20 });
    });
  });

  test.describe('No Client Routes', () => {
    
    test('navigating to /clients should show 404 or redirect', async ({ page }) => {
      await page.goto('/clients');
      await waitForAppReady(page);
      
      // Should either show 404 or redirect to another page (not a clients page)
      const url = page.url();
      const pageContent = await page.locator('body').textContent();
      
      // Should NOT be on a clients management page
      expect(pageContent?.toLowerCase()).not.toContain('add new client');
      expect(pageContent?.toLowerCase()).not.toContain('manage clients');
      expect(pageContent?.toLowerCase()).not.toContain('client list');
    });
  });
});
