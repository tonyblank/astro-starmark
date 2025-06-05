import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Helper function to wait for form state changes (removed - causing timeouts)
 * Using direct element visibility checks instead
 */

/**
 * Helper function to open feedback modal and fill basic form data
 */
async function openModalAndFillForm(page: Page, category: string, comment: string, suggestedTag?: string): Promise<void> {
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
  
  // Fill form with more reliable selectors
  const categorySelect = page.locator('[name="category"]');
  await expect(categorySelect).toBeVisible();
  await categorySelect.selectOption(category);
  
  await page.fill('[name="comment"]', comment);
  
  if (suggestedTag && category === 'Other') {
    // Wait for suggested tag field to become visible
    await expect(page.locator('[name="suggestedTag"]')).toBeVisible();
    await page.fill('[name="suggestedTag"]', suggestedTag);
  }
}

test.describe('API Submission Integration', () => {
  test('successfully submits feedback to real API endpoint', async ({ page }) => {
    await openModalAndFillForm(page, 'Typo', 'Found a spelling error in the documentation');
    
    // Get references before submitting
    const loadingSpinner = page.getByTestId('loading-spinner');
    const successMessage = page.getByTestId('success-message');
    
    // Submit form to real API
    await page.click('[type="submit"]');
    
    // Wait for either loading spinner OR success message to appear
    // This handles the race condition where submission might be very fast
    await Promise.race([
      expect(loadingSpinner).toBeVisible({ timeout: 1000 }).catch(() => {}), // Allow loading to fail
      expect(successMessage).toBeVisible({ timeout: 10000 })
    ]);
    
    // Should show success message after API responds
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    // Loading spinner should be hidden after success
    await expect(loadingSpinner).not.toBeVisible();
    
    // Success message should contain confirmation
    await expect(successMessage).toContainText('Thank you for your feedback');
  });

  test('submits feedback with suggested tag for "Other" category', async ({ page }) => {
    await openModalAndFillForm(page, 'Other', 'Suggestion for improvement', 'user-experience');
    
    // Verify suggested tag field is visible
    const suggestedTagInput = page.locator('[name="suggestedTag"]');
    await expect(suggestedTagInput).toBeVisible();
    await expect(suggestedTagInput).toHaveValue('user-experience');
    
    // Submit form (force click to bypass dev toolbar on mobile)
    await page.click('[type="submit"]', { force: true });
    
    // Should succeed with suggested tag
    const successMessage = page.getByTestId('success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });

  test('handles API validation errors gracefully', async ({ page }) => {
    // Intercept API call to simulate validation error
    await page.route('/api/feedback', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Validation failed',
          retryable: false
        })
      });
    });

    await openModalAndFillForm(page, 'Typo', 'Valid comment for mocking test'); // Use valid category and comment
    
    await page.click('[type="submit"]', { force: true });
    
    // Should show error message
    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
    
    // Should show retry button
    const retryButton = page.getByTestId('retry-button');
    await expect(retryButton).toBeVisible();
    
    // Click retry to reset form state (force click to bypass dev toolbar on mobile)
    await retryButton.click({ force: true });
    
    // Should return to idle state
    await expect(errorMessage).not.toBeVisible();
  });

  test('handles server errors with retry functionality', async ({ page }) => {
    let requestCount = 0;
    
    // Mock server error on first request, success on retry
    await page.route('/api/feedback', async route => {
      requestCount++;
      
      if (requestCount === 1) {
        // First request fails
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error',
            retryable: true
          })
        });
      } else {
        // Second request succeeds
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            id: 'feedback-retry-test',
            message: 'Feedback submitted successfully'
          })
        });
      }
    });

    await openModalAndFillForm(page, 'Confusing', 'This section needs clarification');
    
    // First submission
    await page.click('[type="submit"]', { force: true });
    
    // Should show error message
    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
    
    // Retry the submission
    const retryButton = page.getByTestId('retry-button');
    await retryButton.click({ force: true });
    
    // Fill form again and resubmit
    await page.click('[type="submit"]', { force: true });
    
    // Should show success on retry
    const successMessage = page.getByTestId('success-message');
    await expect(successMessage).toBeVisible();
  });

  test('validates required fields before API submission', async ({ page }) => {
    await page.goto('/getting-started/quick-start');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Open modal
    const widget = page.getByTestId('feedback-widget');
    await widget.click();
    
    const modal = page.getByTestId('feedback-modal');
    await expect(modal).toBeVisible();
    
    // Try to submit without filling required fields
    await page.click('[type="submit"]');
    
    // Browser validation should prevent submission
    const categorySelect = page.locator('[name="category"]');
    const commentTextarea = page.locator('[name="comment"]');
    
    // Check validation states
    const categoryValid = await categorySelect.evaluate(el => (el as HTMLSelectElement).validity.valid);
    const commentValid = await commentTextarea.evaluate(el => (el as HTMLTextAreaElement).validity.valid);
    
    expect(categoryValid).toBe(false);
    expect(commentValid).toBe(false);
    
    // No API call should be made (verified by no loading state)
    const loadingSpinner = page.getByTestId('loading-spinner');
    await expect(loadingSpinner).not.toBeVisible();
  });

  test('includes proper request data in API submission', async ({ page }) => {
    let submittedData: any = null;
    
    // Intercept API call to verify request data
    await page.route('/api/feedback', async route => {
      const request = route.request();
      submittedData = JSON.parse(request.postData() || '{}');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          id: 'test-data-verification',
          message: 'Feedback submitted successfully'
        })
      });
    });

    await openModalAndFillForm(page, 'Feature Request', 'This page is missing important information');
    
    await page.click('[type="submit"]');
    
    // Wait for success to ensure API was called
    const successMessage = page.getByTestId('success-message');
    await expect(successMessage).toBeVisible();
    
    // Verify submitted data structure
    expect(submittedData).toBeDefined();
    expect(submittedData.page).toBe('/getting-started/quick-start');
    expect(submittedData.category).toBe('Feature Request');
    expect(submittedData.comment).toBe('This page is missing important information');
    expect(submittedData.timestamp).toBeDefined();
    expect(submittedData.userAgent).toBeDefined();
    
    // Verify timestamp is valid ISO string
    expect(() => new Date(submittedData.timestamp)).not.toThrow();
    expect(new Date(submittedData.timestamp).toISOString()).toBe(submittedData.timestamp);
  });

  test('handles network failures gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('/api/feedback', async route => {
      await route.abort('failed');
    });

    await openModalAndFillForm(page, 'Question', 'How do I configure this feature?');
    
    await page.click('[type="submit"]');
    
    // Should show error message for network failure
    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
    
    // Should have retry option
    const retryButton = page.getByTestId('retry-button');
    await expect(retryButton).toBeVisible();
  });

  test('modal auto-closes after successful submission', async ({ page }) => {
    await openModalAndFillForm(page, 'Typo', 'Minor typo in code example');
    
    await page.click('[type="submit"]');
    
    // Wait for success message
    const successMessage = page.getByTestId('success-message');
    await expect(successMessage).toBeVisible();
    
    // Modal should auto-close after 3 seconds
    const modal = page.getByTestId('feedback-modal');
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    
    // Focus should return to widget
    const widget = page.getByTestId('feedback-widget');
    
    // Handle WebKit focus restoration
    const browserName = page.context().browser()?.browserType().name();
    if (browserName === 'webkit') {
      await page.waitForTimeout(200);
      await widget.focus();
    }
    
    await expect(widget).toBeFocused();
  });

  test('preserves form data during loading state', async ({ page }) => {
    // Add delay to API response to test loading state
    await page.route('/api/feedback', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          id: 'loading-test',
          message: 'Feedback submitted successfully'
        })
      });
    });

    await openModalAndFillForm(page, 'Feature Request', 'This information is no longer current');
    
    const categorySelect = page.locator('[name="category"]');
    const commentTextarea = page.locator('[name="comment"]');
    
    // Submit form
    await page.click('[type="submit"]');
    
    // During loading, form fields should maintain their values
    const loadingSpinner = page.getByTestId('loading-spinner');
    await expect(loadingSpinner).toBeVisible();
    
    // Values should be preserved
    await expect(categorySelect).toHaveValue('Feature Request');
    await expect(commentTextarea).toHaveValue('This information is no longer current');
    
    // Wait for completion
    const successMessage = page.getByTestId('success-message');
    await expect(successMessage).toBeVisible();
  });

  test('API endpoint returns proper CORS headers', async ({ page }) => {
    let responseHeaders: Record<string, string> = {};
    
    // Intercept API response to check headers
    await page.route('/api/feedback', async route => {
      const response = await route.fetch();
      const headers = response.headers();
      responseHeaders = headers;
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: headers,
        body: JSON.stringify({
          success: true,
          id: 'cors-test',
          message: 'Feedback submitted successfully'
        })
      });
    });

    await openModalAndFillForm(page, 'Bug', 'Found a bug in the interface');
    
    await page.click('[type="submit"]');
    
    // Wait for success
    const successMessage = page.getByTestId('success-message');
    await expect(successMessage).toBeVisible();
    
    // Verify CORS headers
    expect(responseHeaders['access-control-allow-origin']).toBe('*');
    expect(responseHeaders['access-control-allow-methods']).toContain('POST');
    expect(responseHeaders['access-control-allow-headers']).toContain('Content-Type');
  });
}); 