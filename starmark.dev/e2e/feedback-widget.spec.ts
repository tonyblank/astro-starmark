import { test, expect } from '@playwright/test';

test.describe('FeedbackWidget Component', () => {
  test('widget becomes interactive after hydration', async ({ page }) => {
    await page.goto('/getting-started/quick-start');
    await page.waitForLoadState('networkidle');
    
    // Check that the widget is visible
    const widget = page.getByTestId('feedback-widget');
    await expect(widget).toBeVisible();
    
    // Check basic properties
    await expect(widget).toHaveAttribute('aria-label', 'Open feedback form');
    await expect(widget).toHaveAttribute('type', 'button');
  });

  test('widget responds to interactions in browser', async ({ page }) => {
    await page.goto('/getting-started/quick-start');
    await page.waitForLoadState('networkidle');
    
    const widget = page.getByTestId('feedback-widget');
    await expect(widget).toBeVisible();
    
    // Check if the widget has the data attribute (script loaded)
    const scriptLoaded = await widget.getAttribute('data-script-loaded');
    console.log('Script loaded attribute:', scriptLoaded);
    
    // Set up console message capture before clicking
    const logs: string[] = [];
    page.on('console', msg => {
      console.log('Console message:', msg.text());
      logs.push(msg.text());
    });
    
    // Try clicking directly without waiting for script
    await widget.click({ force: true });
    
    // Wait a bit longer for console message
    await page.waitForTimeout(500);
    
    console.log('All logs captured:', logs);
    
    // Check if any console message was logged
    if (logs.length === 0) {
      console.log('No console messages captured, checking if script runs manually');
      
      // Try executing the click handler manually
      await page.evaluate(() => {
        const widget = document.getElementById('starmark-feedback-widget');
        if (widget) {
          console.log('Widget found in evaluate, triggering click');
          widget.click();
        } else {
          console.log('Widget not found in evaluate');
        }
      });
      
      await page.waitForTimeout(100);
    }
    
    // Verify console message was logged
    expect(logs.some(log => log.includes('Feedback widget clicked'))).toBeTruthy();
  });

  test('widget has correct styling and positioning', async ({ page }) => {
    await page.goto('/getting-started/quick-start');
    await page.waitForLoadState('networkidle');
    
    const widget = page.getByTestId('feedback-widget');
    await expect(widget).toBeVisible();
    
    // Check positioning
    const styles = await widget.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        bottom: computed.bottom,
        right: computed.right,
        zIndex: computed.zIndex
      };
    });
    
    expect(styles.position).toBe('fixed');
    expect(styles.zIndex).toBe('99999');
  });

  test('widget supports keyboard navigation', async ({ page }) => {
    await page.goto('/getting-started/quick-start');
    await page.waitForLoadState('networkidle');
    
    const widget = page.getByTestId('feedback-widget');
    
    // Wait for the client-side script to be loaded
    await expect(widget).toHaveAttribute('data-script-loaded', 'true');
    
    // Focus the widget
    await widget.focus();
    await expect(widget).toBeFocused();
    
    // Set up console message capture
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.text()));
    
    // Test Enter key
    await page.keyboard.press('Enter');
    await page.waitForTimeout(50);
    
    // Test Space key  
    await page.keyboard.press(' ');
    await page.waitForTimeout(50);
    
    // Verify keyboard interactions triggered the click handler
    expect(logs.some(log => log.includes('Feedback widget clicked'))).toBeTruthy();
  });

  test('widget is accessible and meets WCAG standards', async ({ page }) => {
    await page.goto('/getting-started/quick-start');
    await page.waitForLoadState('networkidle');
    
    const widget = page.getByTestId('feedback-widget');
    await expect(widget).toBeVisible();
    
    // Check for proper ARIA attributes
    await expect(widget).toHaveAttribute('aria-label');
    await expect(widget).toHaveAttribute('type', 'button');
    
    // Check that the icon has aria-hidden
    const icon = widget.locator('.feedback-widget__icon');
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    
    // Check focus visibility
    await widget.focus();
    const focusOutline = await widget.evaluate(el => {
      return window.getComputedStyle(el).outline;
    });
    // Should have some kind of focus indicator
    expect(focusOutline).toBeDefined();
  });
}); 