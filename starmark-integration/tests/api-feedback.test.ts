import { describe, test, expect } from 'vitest';
import { 
  FeedbackSchema, 
  FeedbackSubmissionResponseSchema,
  type FeedbackData,
  type FeedbackSubmissionResponse
} from '../src/feedback-data.js';

// Mock API endpoint handler for testing
async function mockFeedbackEndpoint(request: Request): Promise<Response> {
  // This simulates the API endpoint logic for testing
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  // Only allow POST method
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Method not allowed. Only POST requests are supported.'
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }

  try {
    // Parse and validate request body
    let feedbackData;
    try {
      feedbackData = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Validate feedback data with Zod schema (throws if invalid)
    FeedbackSchema.parse(feedbackData);

    const response: FeedbackSubmissionResponse = {
      success: true,
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message: 'Feedback submitted successfully'
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    // Handle Zod validation errors or other errors
    let errorMessage = 'Invalid feedback data';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    const response: FeedbackSubmissionResponse = {
      success: false,
      error: errorMessage,
      retryable: false
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}

describe('Feedback API Endpoint Logic', () => {
  test('POST /api/feedback returns success response', async () => {
    const validFeedback: FeedbackData = {
      page: '/docs/getting-started',
      category: 'Typo',
      comment: 'Test comment',
      timestamp: new Date().toISOString(),
      userAgent: 'test-agent'
    };

    const request = new Request('http://localhost:4321/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validFeedback)
    });

    const response = await mockFeedbackEndpoint(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('id');
    
    // Validate response structure with Zod
    expect(() => FeedbackSubmissionResponseSchema.parse(data)).not.toThrow();
  });

  test('returns 400 for invalid feedback data', async () => {
    const invalidFeedback = {
      // Missing required fields
      comment: 'Test comment'
    };

    const request = new Request('http://localhost:4321/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidFeedback)
    });

    const response = await mockFeedbackEndpoint(request);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');
    expect(data.retryable).toBe(false);
  });

  test('returns 405 for unsupported HTTP methods', async () => {
    const request = new Request('http://localhost:4321/api/feedback', {
      method: 'GET'
    });

    const response = await mockFeedbackEndpoint(request);
    
    expect(response.status).toBe(405);
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Method not allowed');
  });

  test('handles malformed JSON', async () => {
    const request = new Request('http://localhost:4321/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json'
    });

    const response = await mockFeedbackEndpoint(request);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid JSON');
  });

  test('includes proper CORS headers', async () => {
    const validFeedback: FeedbackData = {
      page: '/docs/test',
      category: 'Other',
      comment: 'Test comment',
      timestamp: new Date().toISOString(),
      userAgent: 'test-agent'
    };

    const request = new Request('http://localhost:4321/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:4321'
      },
      body: JSON.stringify(validFeedback)
    });

    const response = await mockFeedbackEndpoint(request);
    
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
  });

  test('handles OPTIONS preflight request', async () => {
    const request = new Request('http://localhost:4321/api/feedback', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:4321',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });

    const response = await mockFeedbackEndpoint(request);
    
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  test('validates feedback data comprehensively', async () => {
    // Test with full valid feedback
    const fullFeedback: FeedbackData = {
      page: '/docs/test',
      category: 'Confusing',
      comment: 'This section is unclear',
      timestamp: new Date().toISOString(),
      userAgent: 'Mozilla/5.0 test',
      highlightedText: 'highlighted content',
      sectionId: 'section-id',
      suggestedTag: 'clarity',
      userEmail: 'test@example.com',
      userName: 'Test User'
    };

    const request = new Request('http://localhost:4321/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fullFeedback)
    });

    const response = await mockFeedbackEndpoint(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('rejects invalid categories', async () => {
    const invalidFeedback = {
      page: '/docs/test',
      category: 'InvalidCategory',
      comment: 'Test comment',
      timestamp: new Date().toISOString(),
      userAgent: 'test-agent'
    };

    const request = new Request('http://localhost:4321/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidFeedback)
    });

    const response = await mockFeedbackEndpoint(request);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
}); 