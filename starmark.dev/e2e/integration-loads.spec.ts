import { test, expect } from '@playwright/test';

test.describe('StarMark Integration Loading', () => {
  test('should load the site without errors', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Check that the page title is correct
    await expect(page).toHaveTitle(/StarMark/);
    
    // Verify the main heading is present
    await expect(page.getByRole('heading', { name: /Welcome to StarMark/i })).toBeVisible();
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to the homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that no console errors occurred
    expect(consoleErrors).toHaveLength(0);
  });

  test('should load starmark integration without breaking the site', async ({ page }) => {
    // Navigate to a documentation page
    await page.goto('/getting-started/quick-start/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Verify the page content loads correctly
    await expect(page.getByRole('heading', { name: /Quick Start/i })).toBeVisible();
    
    // Verify starlight navigation works
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // The integration should not break the page rendering
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have proper accessibility structure', async ({ page }) => {
    await page.goto('/');
    
    // Wait for full load
    await page.waitForLoadState('networkidle');
    
    // Check for basic accessibility landmarks
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Verify heading hierarchy (should start with h1)
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
  });
}); 