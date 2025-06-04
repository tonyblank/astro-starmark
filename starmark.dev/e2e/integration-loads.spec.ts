import { test, expect } from '@playwright/test';

test.describe('Integration Loading Tests', () => {
  test('should load basic pages without breaking', async ({ page }) => {
    // Enable detailed logging for CI debugging
    if (process.env.CI) {
      page.on('console', msg => console.log('PAGE LOG:', msg.text()));
      page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    }

    // Test homepage with better error handling
    console.log('Testing homepage...');
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for content to be available and check for errors
    await page.waitForLoadState('networkidle');
    
    // Check if we got a 404 or other error
    const title = await page.title();
    console.log('Page title:', title);
    
    // More flexible heading check (in case the exact text varies)
    const mainHeading = page.locator('h1').first();
    await expect(mainHeading).toBeVisible({ timeout: 10000 });
    
    const headingText = await mainHeading.textContent();
    console.log('Main heading text:', headingText);
    expect(headingText).toMatch(/Welcome to StarMark/i);

    // Test quick start page
    console.log('Testing quick start page...');
    await page.goto('/getting-started/quick-start/', { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');
    
    const quickStartHeading = page.locator('h1').first();
    await expect(quickStartHeading).toBeVisible({ timeout: 10000 });
    
    const quickStartText = await quickStartHeading.textContent();
    console.log('Quick start heading text:', quickStartText);
    expect(quickStartText).toMatch(/Quick Start/i);
  });

  test('should have proper navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Test for main sidebar navigation specifically (not table of contents)
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  });

  test('should load starmark integration without breaking the site', async ({ page }) => {
    // Navigate to the homepage first (more reliable than a deep page)
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Verify the main page content loads correctly (basic integration test)
    const mainHeading = page.locator('h1').first();
    await expect(mainHeading).toBeVisible({ timeout: 10000 });
    
    // Verify starlight main navigation works (not table of contents)
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
    
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