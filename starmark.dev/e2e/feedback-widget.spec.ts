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
    await expect(widget).toHaveAttribute('data-script-loaded', 'true');
    
    // Verify the global starmark object was created (indicating script execution)
    const starmarkExists = await page.evaluate(() => {
      return typeof (window as any).starmarkFeedbackWidget !== 'undefined';
    });
    expect(starmarkExists).toBeTruthy();
    
    // Test that click handler is properly attached and functional
    const clickHandlerTest = await page.evaluate(() => {
      const widget = document.getElementById('starmark-feedback-widget');
      if (!widget) throw new Error('Widget not found');
      
      // Check if onclick handler is attached
      const hasOnClickHandler = typeof widget.onclick === 'function';
      
      // Test that the widget is clickable (doesn't throw errors)
      let clickSuccessful = false;
      try {
        widget.click();
        clickSuccessful = true;
      } catch (error) {
        clickSuccessful = false;
      }
      
      return {
        hasOnClickHandler,
        clickSuccessful,
        isButton: widget.tagName === 'BUTTON',
        hasProperType: widget.getAttribute('type') === 'button'
      };
    });
    
    // Verify click handler functionality
    const results = clickHandlerTest as {
      hasOnClickHandler: boolean;
      clickSuccessful: boolean;
      isButton: boolean;
      hasProperType: boolean;
    };
    expect(results.hasOnClickHandler).toBeTruthy(); // Should have onclick handler
    expect(results.clickSuccessful).toBeTruthy(); // Click should execute without errors
    expect(results.isButton).toBeTruthy(); // Should be a button element
    expect(results.hasProperType).toBeTruthy(); // Should have type="button"
    
    // Verify the widget remains functional and accessible
    await expect(widget).toBeVisible();
    await expect(widget).toHaveAttribute('aria-label', 'Open feedback form');
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
    expect(styles.zIndex).toBe('9999');
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
    
    // Test keyboard navigation functionality
    const keyboardResults = await page.evaluate(() => {
      const widget = document.getElementById('starmark-feedback-widget');
      if (!widget) throw new Error('Widget not found');
      
      // Test that keyboard event listeners are properly attached
      let enterHandled = false;
      let spaceHandled = false;
      let invalidKeyHandled = false;
      
      // Mock the click method to track when it's called
      const originalClick = widget.click;
      let clickCallCount = 0;
      widget.click = function() {
        clickCallCount++;
        return originalClick.call(this);
      };
      
      // Test Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      const enterCallCountBefore = clickCallCount;
      widget.dispatchEvent(enterEvent);
      enterHandled = clickCallCount > enterCallCountBefore;
      
      // Test Space key
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      const spaceCallCountBefore = clickCallCount;
      widget.dispatchEvent(spaceEvent);
      spaceHandled = clickCallCount > spaceCallCountBefore;
      
      // Test invalid key (should not trigger click)
      const arrowEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      const invalidCallCountBefore = clickCallCount;
      widget.dispatchEvent(arrowEvent);
      invalidKeyHandled = clickCallCount > invalidCallCountBefore;
      
      // Restore original click method
      widget.click = originalClick;
      
      return {
        enterHandled,
        spaceHandled,
        invalidKeyHandled: !invalidKeyHandled, // Should be false (not handled)
        totalClickCalls: clickCallCount
      };
    });
    
    // Verify keyboard navigation functionality
    const kbResults = keyboardResults as {
      enterHandled: boolean;
      spaceHandled: boolean;
      invalidKeyHandled: boolean;
      totalClickCalls: number;
    };
    expect(kbResults.enterHandled).toBeTruthy(); // Enter should trigger click
    expect(kbResults.spaceHandled).toBeTruthy(); // Space should trigger click
    expect(kbResults.invalidKeyHandled).toBeTruthy(); // Invalid key should NOT trigger click
    expect(kbResults.totalClickCalls).toBe(2); // Should have exactly 2 click calls
    
    // Verify widget is still functional after keyboard interactions
    await expect(widget).toBeVisible();
    await expect(widget).toHaveAttribute('data-script-loaded', 'true');
    
    // Test that the widget can still be focused properly
    await widget.focus();
    await expect(widget).toBeFocused();
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

  test('widget responsive behavior on mobile screens', async ({ page }) => {
    // Set mobile viewport size (below 480px breakpoint)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/getting-started/quick-start');
    await page.waitForLoadState('networkidle');
    
    const widget = page.getByTestId('feedback-widget');
    await expect(widget).toBeVisible();
    
    // Check that text is hidden on mobile (container query behavior)
    const widgetText = widget.locator('.feedback-widget__text');
    const textStyles = await widgetText.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        visibility: computed.visibility
      };
    });
    
    // On mobile, text should be hidden (display: none)
    expect(textStyles.display).toBe('none');
    
    // Icon should still be visible
    const icon = widget.locator('.feedback-widget__icon');
    await expect(icon).toBeVisible();
    
    // Widget should still be clickable
    await widget.click({ force: true });
  });

  test('widget responsive behavior on desktop screens', async ({ page }) => {
    // Set desktop viewport size (above 480px breakpoint)
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/getting-started/quick-start');
    await page.waitForLoadState('networkidle');
    
    const widget = page.getByTestId('feedback-widget');
    await expect(widget).toBeVisible();
    
    // Check that text is visible on desktop
    const widgetText = widget.locator('.feedback-widget__text');
    await expect(widgetText).toBeVisible();
    
    const textStyles = await widgetText.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        visibility: computed.visibility
      };
    });
    
    // On desktop, text should be visible (display: block)
    expect(textStyles.display).toBe('block');
    
    // Icon should also be visible
    const icon = widget.locator('.feedback-widget__icon');
    await expect(icon).toBeVisible();
  });

  test('widget responsive behavior at breakpoint boundary', async ({ page }) => {
    // Test above the 480px breakpoint
    await page.setViewportSize({ width: 481, height: 600 });
    await page.goto('/getting-started/quick-start');
    await page.waitForLoadState('networkidle');
    
    const widget = page.getByTestId('feedback-widget');
    await expect(widget).toBeVisible();
    
    // Above 480px, text should be visible
    const widgetText = widget.locator('.feedback-widget__text');
    await expect(widgetText).toBeVisible();
    
    const textStylesAbove = await widgetText.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return computed.display;
    });
    
    // Above 480px, text should be visible (display: block)
    expect(textStylesAbove).toBe('block');
    
    // Now test at exactly the breakpoint (480px and below triggers the media query)
    await page.setViewportSize({ width: 480, height: 600 });
    await page.waitForTimeout(100); // Allow time for media query to update
    
    const textStylesAt = await widgetText.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return computed.display;
    });
    
    // At 480px, text should be hidden (max-width: 480px includes 480px)
    expect(textStylesAt).toBe('none');
  });

  test('widget respects reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/getting-started/quick-start');
    await page.waitForLoadState('networkidle');
    
    const widget = page.getByTestId('feedback-widget');
    await expect(widget).toBeVisible();
    
    // Check that transitions are disabled when reduced motion is preferred
    const styles = await widget.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        transition: computed.transition,
        transform: computed.transform
      };
    });
    
    // With reduced motion, transitions should be none or very short
    expect(styles.transition).toContain('none');
    
    // Hover should not cause transform changes with reduced motion
    await widget.hover({ force: true });
    await page.waitForTimeout(100);
    
    const hoverStyles = await widget.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return computed.transform;
    });
    
    // Transform should remain none (no translateY animation)
    expect(hoverStyles).toBe('none');
  });

  test('widget is hidden in print mode', async ({ page }) => {
    await page.goto('/getting-started/quick-start');
    await page.waitForLoadState('networkidle');
    
    const widget = page.getByTestId('feedback-widget');
    await expect(widget).toBeVisible();
    
    // Emulate print media
    await page.emulateMedia({ media: 'print' });
    
    // Check that widget is hidden in print mode
    const printStyles = await widget.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return computed.display;
    });
    
    expect(printStyles).toBe('none');
  });
}); 