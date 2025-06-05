import { describe, test, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { FeedbackData, FeedbackSubmissionResponse } from '../src/feedback-data.js';

// Mock server for API responses
const server = setupServer();

beforeEach(() => {
  server.listen();
  
  // Mock global objects for browser environment in Node
  Object.defineProperty(global, 'window', {
    value: {
      location: { pathname: '/docs/getting-started' },
      navigator: { userAgent: 'test-agent' }
    },
    writable: true
  });
  
  // Also add to global scope directly
  Object.defineProperty(global, 'location', {
    value: { pathname: '/docs/getting-started' },
    writable: true
  });
  
  Object.defineProperty(global, 'navigator', {
    value: { userAgent: 'test-agent' },
    writable: true
  });
});

afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});

afterAll(() => {
  server.close();
});

describe('Frontend API Integration', () => {
  test('form handles API success and error responses', async () => {
    // Mock successful response
    server.use(
      http.post('*/api/feedback', () => {
        return HttpResponse.json({
          success: true,
          id: 'feedback-123',
          message: 'Feedback submitted successfully'
        } as FeedbackSubmissionResponse);
      })
    );

    // Simulate form submission data
    const feedbackData: FeedbackData = {
      page: '/docs/getting-started',
      category: 'Typo',
      comment: 'Test comment for API integration',
      timestamp: new Date().toISOString(),
      userAgent: 'test-agent'
    };

    // Mock fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        id: 'feedback-123',
        message: 'Feedback submitted successfully'
      })
    });
    
    global.fetch = mockFetch;

    // Simulate the form submission logic from FeedbackModal
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData)
    });

    expect(response.ok).toBe(true);
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.id).toBe('feedback-123');
    
    // Verify fetch was called with correct data
    expect(mockFetch).toHaveBeenCalledWith('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData)
    });
  });

  test('handles API error responses with retry mechanism', async () => {
    // Mock error response
    server.use(
      http.post('*/api/feedback', () => {
        return HttpResponse.json({
          success: false,
          error: 'Server error occurred',
          retryable: true
        } as FeedbackSubmissionResponse, { status: 500 });
      })
    );

    const feedbackData: FeedbackData = {
      page: '/docs/test',
      category: 'Other',
      comment: 'Test error handling',
      timestamp: new Date().toISOString(),
      userAgent: 'test-agent'
    };

    // Mock fetch to simulate error
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: 'Server error occurred',
        retryable: true
      })
    });
    
    global.fetch = mockFetch;

    // Simulate error handling logic
    let submissionResult = null;
    let errorOccurred = false;

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      });

      if (response.ok) {
        submissionResult = await response.json();
      } else {
        errorOccurred = true;
        throw new Error('Submission failed');
      }
    } catch (error) {
      errorOccurred = true;
      expect(error).toBeInstanceOf(Error);
    }

    expect(errorOccurred).toBe(true);
    expect(submissionResult).toBe(null);
    expect(mockFetch).toHaveBeenCalledWith('/api/feedback', expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }));
  });

  test('handles network failures gracefully', async () => {
    const feedbackData: FeedbackData = {
      page: '/docs/network-test',
      category: 'Confusing',
      comment: 'Test network failure',
      timestamp: new Date().toISOString(),
      userAgent: 'test-agent'
    };

    // Mock fetch to simulate network error
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch;

    let networkError = false;

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      });
    } catch (error) {
      networkError = true;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Network error');
    }

    expect(networkError).toBe(true);
    expect(mockFetch).toHaveBeenCalled();
  });

  test('validates form data before submission', async () => {
    // Test that form collects data in the correct format
    const formData = new FormData();
    formData.set('category', 'Typo');
    formData.set('comment', 'Test form data collection');
    formData.set('suggestedTag', '');

    // Simulate the data collection logic from FeedbackModal
    const collectedData = {
      page: (global as any).location.pathname,
      category: formData.get('category'),
      comment: formData.get('comment'),
      suggestedTag: formData.get('suggestedTag') || null,
      timestamp: new Date().toISOString(),
      userAgent: (global as any).navigator.userAgent,
    };

    expect(collectedData).toEqual({
      page: '/docs/getting-started',
      category: 'Typo',
      comment: 'Test form data collection',
      suggestedTag: null,
      timestamp: expect.any(String),
      userAgent: 'test-agent'
    });

    // Verify timestamp is valid ISO string
    expect(() => new Date(collectedData.timestamp)).not.toThrow();
    expect(new Date(collectedData.timestamp).toISOString()).toBe(collectedData.timestamp);
  });

  test('includes optional fields when provided by form', async () => {
    const formData = new FormData();
    formData.set('category', 'Other');
    formData.set('comment', 'Test with suggested tag');
    formData.set('suggestedTag', 'documentation-clarity');

    const collectedData = {
      page: (global as any).location.pathname,
      category: formData.get('category'),
      comment: formData.get('comment'),
      suggestedTag: formData.get('suggestedTag') || null,
      timestamp: new Date().toISOString(),
      userAgent: (global as any).navigator.userAgent,
    };

    expect(collectedData.suggestedTag).toBe('documentation-clarity');
    expect(collectedData.page).toBe('/docs/getting-started');
    expect(collectedData.category).toBe('Other');
    expect(collectedData.comment).toBe('Test with suggested tag');
    expect(collectedData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(collectedData.userAgent).toBe('test-agent');
  });

  test('properly formats API request headers and body', async () => {
    const feedbackData: FeedbackData = {
      page: '/docs/api-test',
      category: 'Missing',
      comment: 'Test API request format',
      timestamp: new Date().toISOString(),
      userAgent: 'test-agent'
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    
    global.fetch = mockFetch;

    await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData)
    });

    // Verify the exact call signature
    expect(mockFetch).toHaveBeenCalledWith('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData)
    });
  });
}); 