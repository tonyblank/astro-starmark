import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Helper function to open feedback modal and fill basic form data
 */
async function openModalAndFillForm(page: Page, category: string, comment: string): Promise<void> {
  await page.goto('/getting-started/quick-start');
  await page.waitForLoadState('networkidle');
  
  // Wait for scripts to initialize
  await page.waitForTimeout(500);
  
  // Open modal
  const widget = page.getByTestId('feedback-widget');
  await expect(widget).toBeVisible();
  await widget.click();
  
  // Wait for modal to open and form to be ready
  const modal = page.getByTestId('feedback-modal');
  await expect(modal).toBeVisible();
  
  // Wait for form state to be idle (scripts initialized)
  await page.waitForSelector('.feedback-modal__form[data-state="idle"]');
  
  // Fill form
  const categorySelect = page.locator('[name="category"]');
  await expect(categorySelect).toBeVisible();
  await categorySelect.selectOption(category);
  
  await page.fill('[name="comment"]', comment);
}

test.describe('Storage Connector Functionality', () => {
  test('API endpoint successfully handles feedback with storage connectors', async ({ page }) => {
    // Test that the storage connector system works end-to-end
    await openModalAndFillForm(page, 'Bug', 'Testing storage connector functionality');
    
    // Intercept API call to validate the structure
    let apiResponse;
    await page.route('/api/feedback', async route => {
      const response = await route.fetch();
      apiResponse = await response.json();
      await route.fulfill({ response });
    });
    
    // Submit form
    await page.click('[type="submit"]');
    
    // Wait for success message
    const successMessage = page.getByTestId('success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    // Verify API response structure
    expect(apiResponse).toBeDefined();
    expect(apiResponse).toHaveProperty('success', true);
    expect(apiResponse).toHaveProperty('id');
    expect(apiResponse).toHaveProperty('message');
    expect(apiResponse).toHaveProperty('metadata');
    
    // Safe access with proper type checking
    if (apiResponse?.metadata) {
      expect(apiResponse.metadata).toHaveProperty('connectorsUsed');
      expect(apiResponse.metadata).toHaveProperty('results');
      expect(Array.isArray(apiResponse.metadata.results)).toBe(true);
      expect(apiResponse.metadata.results.length).toBeGreaterThan(0);
      
      // Verify at least one connector was used
      const connectorResult = apiResponse.metadata.results[0];
      expect(connectorResult).toHaveProperty('connector');
      expect(connectorResult).toHaveProperty('success');
      expect(connectorResult).toHaveProperty('id');
      expect(connectorResult).toHaveProperty('healthy');
    }
  });

  test('API endpoint handles multiple storage connectors correctly', async ({ page }) => {
    // This test verifies the system can work with multiple connectors
    await openModalAndFillForm(page, 'Feature Request', 'Testing multiple connector support');
    
    let apiResponse;
    await page.route('/api/feedback', async route => {
      const response = await route.fetch();
      apiResponse = await response.json();
      await route.fulfill({ response });
    });
    
    await page.click('[type="submit"]');
    
    const successMessage = page.getByTestId('success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    // Verify the response indicates proper connector handling
    expect(apiResponse).toBeDefined();
    expect(apiResponse!.success).toBe(true);
    expect(apiResponse!.metadata.connectorsUsed).toBeGreaterThanOrEqual(1);
    
    // All used connectors should have proper result structure
    for (const result of apiResponse!.metadata.results) {
      expect(typeof result.connector).toBe('string');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.healthy).toBe('boolean');
      if (result.success) {
        expect(typeof result.id).toBe('string');
      }
    }
  });

  test('API endpoint provides correlation ID for tracking', async ({ page }) => {
    // Test that each submission gets a unique correlation ID
    await openModalAndFillForm(page, 'Question', 'Testing correlation ID functionality');
    
    let firstApiResponse;
    await page.route('/api/feedback', async route => {
      const response = await route.fetch();
      firstApiResponse = await response.json();
      await route.fulfill({ response });
    });
    
    await page.click('[type="submit"]');
    
    const successMessage = page.getByTestId('success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    // Modal should auto-close after successful submission, wait for it to close
    await expect(page.getByTestId('feedback-modal')).not.toBeVisible({ timeout: 5000 });
    
    await openModalAndFillForm(page, 'Typo', 'Second submission for correlation ID test');
    
    let secondApiResponse;
    await page.route('/api/feedback', async route => {
      const response = await route.fetch();
      secondApiResponse = await response.json();
      await route.fulfill({ response });
    });
    
    await page.click('[type="submit"]');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    // Verify both responses have different correlation IDs
    expect(firstApiResponse).toBeDefined();
    expect(secondApiResponse).toBeDefined();
    expect(firstApiResponse!.id).toBeDefined();
    expect(secondApiResponse!.id).toBeDefined();
    expect(firstApiResponse!.id).not.toBe(secondApiResponse!.id);
    
    // Verify correlation ID format (UUID-like)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(firstApiResponse!.id).toMatch(uuidRegex);
    expect(secondApiResponse!.id).toMatch(uuidRegex);
  });

  test('storage connector system handles partial failures gracefully', async ({ page }) => {
    // Mock a scenario where one connector fails but others succeed
    let callCount = 0;
    await page.route('/api/feedback', async route => {
      callCount++;
      
      if (callCount === 1) {
        // First call - simulate partial failure
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true, // Overall success despite one connector failing
            id: 'test-correlation-id',
            message: 'Feedback submitted successfully',
            metadata: {
              connectorsUsed: 2,
              results: [
                {
                  connector: 'mock',
                  success: true,
                  id: 'mock-success-id',
                  healthy: true
                },
                {
                  connector: 'linear',
                  success: false,
                  error: 'Connection timeout',
                  healthy: false,
                  retryable: true
                }
              ]
            }
          })
        });
      } else {
        // Let other calls go through normally
        const response = await route.fetch();
        await route.fulfill({ response });
      }
    });
    
    await openModalAndFillForm(page, 'Bug', 'Testing partial connector failure handling');
    await page.click('[type="submit"]');
    
    // Should still show success message because at least one connector succeeded
    const successMessage = page.getByTestId('success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Storage Connector Error Handling', () => {
  test('handles complete storage connector failure', async ({ page }) => {
    // Mock scenario where all connectors fail
    await page.route('/api/feedback', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'No storage connectors available',
          retryable: true
        })
      });
    });
    
    await openModalAndFillForm(page, 'Bug', 'Testing complete connector failure');
    await page.click('[type="submit"]');
    
    // Should show error message
    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
    
    // Should show retry button for retryable errors
    const retryButton = page.getByTestId('retry-button');
    await expect(retryButton).toBeVisible();
  });

  test('handles connector timeout scenarios', async ({ page }) => {
    // Mock slow connector response
    await page.route('/api/feedback', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Request timeout - storage connectors unavailable',
          retryable: true
        })
      });
    });
    
    await openModalAndFillForm(page, 'Question', 'Testing connector timeout handling');
    await page.click('[type="submit"]');
    
    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
    // Check for generic error message since specific timeout message may vary
    await expect(errorMessage).toContainText('couldn\'t submit');
    
    const retryButton = page.getByTestId('retry-button');
    await expect(retryButton).toBeVisible();
  });

  test('handles connector health check failures', async ({ page }) => {
    // Mock response indicating unhealthy connectors (500 status for error handling)
    await page.route('/api/feedback', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'All storage connectors are unhealthy',
          retryable: true
        })
      });
    });
    
    await openModalAndFillForm(page, 'Typo', 'Testing unhealthy connector handling');
    await page.click('[type="submit"]');
    
    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
    
    const retryButton = page.getByTestId('retry-button');
    await expect(retryButton).toBeVisible();
  });
});