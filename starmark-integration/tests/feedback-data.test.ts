import { describe, test, expect } from 'vitest';
import { 
  FeedbackSchema, 
  type FeedbackData,
  type FeedbackSubmissionResponse,
  FeedbackSubmissionResponseSchema
} from '../src/feedback-data';

describe('Feedback Data Structure', () => {
  test('FeedbackData schema validates correctly', () => {
    const validFeedback: FeedbackData = {
      page: '/docs/getting-started',
      category: 'Typo',
      comment: 'Test comment',
      timestamp: new Date().toISOString(),
      userAgent: 'Mozilla/5.0 (test agent)',
      highlightedText: 'selected text',
      sectionId: 'introduction'
    };
    
    expect(() => FeedbackSchema.parse(validFeedback)).not.toThrow();
    
    const parsed = FeedbackSchema.parse(validFeedback);
    expect(parsed).toEqual(validFeedback);
  });

  test('validates required fields', () => {
    const invalidFeedback = {
      // Missing required fields
      comment: 'Test comment'
    };
    
    expect(() => FeedbackSchema.parse(invalidFeedback)).toThrow();
  });

  test('validates category enum values', () => {
    const validCategories = ['Typo', 'Confusing', 'Outdated', 'Missing', 'Other'];
    
    validCategories.forEach(category => {
      const feedback = {
        page: '/docs/test',
        category,
        comment: 'Test comment',
        timestamp: new Date().toISOString(),
        userAgent: 'test-agent'
      };
      
      expect(() => FeedbackSchema.parse(feedback)).not.toThrow();
    });
    
    // Test invalid category
    const invalidFeedback = {
      page: '/docs/test',
      category: 'InvalidCategory',
      comment: 'Test comment',
      timestamp: new Date().toISOString(),
      userAgent: 'test-agent'
    };
    
    expect(() => FeedbackSchema.parse(invalidFeedback)).toThrow();
  });

  test('validates optional fields', () => {
    const minimalFeedback = {
      page: '/docs/test',
      category: 'Typo',
      comment: 'Test comment',
      timestamp: new Date().toISOString(),
      userAgent: 'test-agent'
    };
    
    expect(() => FeedbackSchema.parse(minimalFeedback)).not.toThrow();
    
    const fullFeedback = {
      ...minimalFeedback,
      highlightedText: 'selected text',
      sectionId: 'section-1',
      suggestedTag: 'documentation',
      userEmail: 'test@example.com',
      userName: 'Test User'
    };
    
    expect(() => FeedbackSchema.parse(fullFeedback)).not.toThrow();
  });

  test('validates string length constraints', () => {
    const baseFeedback = {
      page: '/docs/test',
      category: 'Typo' as const,
      timestamp: new Date().toISOString(),
      userAgent: 'test-agent'
    };
    
    // Test comment length
    expect(() => FeedbackSchema.parse({
      ...baseFeedback,
      comment: ''  // Empty comment should fail
    })).toThrow();
    
    expect(() => FeedbackSchema.parse({
      ...baseFeedback,
      comment: 'a'.repeat(5001)  // Too long comment should fail
    })).toThrow();
    
    // Valid comment length
    expect(() => FeedbackSchema.parse({
      ...baseFeedback,
      comment: 'Valid comment length'
    })).not.toThrow();
  });

  test('validates URL format for page field', () => {
    const baseFeedback = {
      category: 'Typo' as const,
      comment: 'Test comment',
      timestamp: new Date().toISOString(),
      userAgent: 'test-agent'
    };
    
    // Valid page paths
    const validPages = ['/docs/test', '/docs/getting-started', '/api/feedback', '/'];
    validPages.forEach(page => {
      expect(() => FeedbackSchema.parse({ ...baseFeedback, page })).not.toThrow();
    });
    
    // Invalid page paths
    const invalidPages = ['', 'docs/test', 'http://external.com'];
    invalidPages.forEach(page => {
      expect(() => FeedbackSchema.parse({ ...baseFeedback, page })).toThrow();
    });
  });

  test('validates timestamp format', () => {
    const baseFeedback = {
      page: '/docs/test',
      category: 'Typo' as const,
      comment: 'Test comment',
      userAgent: 'test-agent'
    };
    
    // Valid ISO timestamp
    expect(() => FeedbackSchema.parse({
      ...baseFeedback,
      timestamp: new Date().toISOString()
    })).not.toThrow();
    
    // Invalid timestamp formats
    const invalidTimestamps = ['2023-01-01', '1234567890', 'invalid-date'];
    invalidTimestamps.forEach(timestamp => {
      expect(() => FeedbackSchema.parse({ ...baseFeedback, timestamp })).toThrow();
    });
  });
});

describe('Feedback Submission Response', () => {
  test('validates successful response', () => {
    const successResponse: FeedbackSubmissionResponse = {
      success: true,
      id: 'feedback-123',
      message: 'Feedback submitted successfully'
    };
    
    expect(() => FeedbackSubmissionResponseSchema.parse(successResponse)).not.toThrow();
  });

  test('validates error response', () => {
    const errorResponse: FeedbackSubmissionResponse = {
      success: false,
      error: 'Validation failed',
      retryable: true
    };
    
    expect(() => FeedbackSubmissionResponseSchema.parse(errorResponse)).not.toThrow();
  });

  test('requires success field', () => {
    const invalidResponse = {
      id: 'feedback-123'
      // Missing success field
    };
    
    expect(() => FeedbackSubmissionResponseSchema.parse(invalidResponse)).toThrow();
  });
}); 