import { test, expect } from '@playwright/test';

test.describe('Integration Loading Tests', () => {
  test('should load basic pages without breaking', async ({ page }) => {
    // Test homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Welcome to StarMark/i })).toBeVisible();

    // Test quick start page
    await page.goto('/getting-started/quick-start/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Quick Start/i })).toBeVisible();
  });

  test('should have proper navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should load starmark integration without breaking the site', async ({ page }) => {
    // Navigate to the homepage first (more reliable than a deep page)
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Verify the main page content loads correctly (basic integration test)
    await expect(page.getByRole('heading', { name: /Welcome to StarMark/i })).toBeVisible();
    
    // Verify starlight navigation works
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // The integration should not break the page rendering
    await expect(page.locator('body')).toBeVisible();

    // ENHANCEMENT: Integration should fail gracefully when env vars not set
    // Since we're using empty string fallbacks, the integration will abort during
    // configuration validation, which is the correct behavior for missing credentials
    
    // ENHANCEMENT: Test that integration loads successfully when proper env vars are set
    // This would require setting PLAYWRIGHT_LINEAR_API_KEY, etc. environment variables
    // for a full integration test, but that's outside scope for basic loading test
  });
}); 