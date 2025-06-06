import { describe, test, expect, beforeEach } from 'vitest';
import { FeedbackHandler } from '../src/storage/FeedbackHandler';
import { MockStorageConnector } from './test-helpers';
import { StorageRegistry } from '../src/storage/StorageRegistry';
import type { FeedbackData } from '../src/types';

describe('FeedbackHandler', () => {
  let handler: FeedbackHandler;
  let registry: StorageRegistry;
  let linearConnector: MockStorageConnector;
  let astroDbConnector: MockStorageConnector;

  beforeEach(() => {
    registry = new StorageRegistry();
    linearConnector = new MockStorageConnector('linear');
    astroDbConnector = new MockStorageConnector('astrodb');
    
    registry.register(linearConnector);
    registry.register(astroDbConnector);
    
    handler = new FeedbackHandler(registry);
  });

  test('should process feedback through all available connectors', async () => {
    const feedback: FeedbackData = {
      page: '/docs/test',
      category: 'Typo',
      comment: 'Test feedback',
      timestamp: new Date().toISOString(),
    };

    linearConnector.setDetectionResult(true);
    astroDbConnector.setDetectionResult(true);

    const result = await handler.processFeedback(feedback);

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(2);
    expect(result.results.some(r => r.connector === 'linear' && r.success)).toBe(true);
    expect(result.results.some(r => r.connector === 'astrodb' && r.success)).toBe(true);
  });

  test('should handle connector failures gracefully', async () => {
    const feedback: FeedbackData = {
      page: '/docs/test',
      category: 'Bug',
      comment: 'Test feedback',
      timestamp: new Date().toISOString(),
    };

    linearConnector.setDetectionResult(true);
    astroDbConnector.setDetectionResult(true);
    
    // Make linear connector fail
    linearConnector.setStoreResult({
      success: false,
      error: new Error('Linear API down'),
      retryable: true,
    });

    const result = await handler.processFeedback(feedback);

    expect(result.success).toBe(true); // Should still be successful if one connector works
    expect(result.results).toHaveLength(2);
    expect(result.results.find(r => r.connector === 'linear')?.success).toBe(false);
    expect(result.results.find(r => r.connector === 'astrodb')?.success).toBe(true);
  });

  test('should return failure when all connectors fail', async () => {
    const feedback: FeedbackData = {
      page: '/docs/test',
      category: 'Bug',
      comment: 'Test feedback',
      timestamp: new Date().toISOString(),
    };

    linearConnector.setDetectionResult(true);
    astroDbConnector.setDetectionResult(true);
    
    // Make both connectors fail
    linearConnector.setStoreResult({
      success: false,
      error: new Error('Linear API down'),
      retryable: true,
    });
    
    astroDbConnector.setStoreResult({
      success: false,
      error: new Error('Database down'),
      retryable: true,
    });

    const result = await handler.processFeedback(feedback);

    expect(result.success).toBe(false);
    expect(result.results).toHaveLength(2);
    expect(result.results.every(r => !r.success)).toBe(true);
  });

  test('should only use available connectors', async () => {
    const feedback: FeedbackData = {
      page: '/docs/test',
      category: 'Feature Request',
      comment: 'Test feedback',
      timestamp: new Date().toISOString(),
    };

    // Only linear is available
    linearConnector.setDetectionResult(true);
    astroDbConnector.setDetectionResult(false);

    const result = await handler.processFeedback(feedback);

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].connector).toBe('linear');
  });

  test('should handle no available connectors', async () => {
    const feedback: FeedbackData = {
      page: '/docs/test',
      category: 'Question',
      comment: 'Test feedback',
      timestamp: new Date().toISOString(),
    };

    // No connectors available
    linearConnector.setDetectionResult(false);
    astroDbConnector.setDetectionResult(false);

    const result = await handler.processFeedback(feedback);

    expect(result.success).toBe(false);
    expect(result.error).toBe('No storage connectors available');
    expect(result.results).toHaveLength(0);
  });

  test('should include health status in results', async () => {
    const feedback: FeedbackData = {
      page: '/docs/test',
      category: 'Typo',
      comment: 'Test feedback',
      timestamp: new Date().toISOString(),
    };

    linearConnector.setDetectionResult(true);
    linearConnector.setHealthResult(false); // Unhealthy
    astroDbConnector.setDetectionResult(true);
    astroDbConnector.setHealthResult(true); // Healthy

    const result = await handler.processFeedback(feedback);

    expect(result.results).toHaveLength(2);
    
    const linearResult = result.results.find(r => r.connector === 'linear');
    const astroDbResult = result.results.find(r => r.connector === 'astrodb');
    
    expect(linearResult?.healthy).toBe(false);
    expect(astroDbResult?.healthy).toBe(true);
  });

  test('should provide correlation ID for tracking', async () => {
    const feedback: FeedbackData = {
      page: '/docs/test',
      category: 'Typo',
      comment: 'Test feedback',
      timestamp: new Date().toISOString(),
    };

    linearConnector.setDetectionResult(true);

    const result = await handler.processFeedback(feedback);

    expect(result.correlationId).toBeDefined();
    expect(typeof result.correlationId).toBe('string');
    expect(result.correlationId).toMatch(/^[a-f0-9-]+$/); // UUID format
  });

  test('should get health status of all connectors', async () => {
    linearConnector.setHealthResult(true);
    astroDbConnector.setHealthResult(false);

    const health = await handler.getHealthStatus();

    expect(health.get('linear')).toBe(true);
    expect(health.get('astrodb')).toBe(false);
  });

  test('should handle connector detection errors gracefully', async () => {
    const feedback: FeedbackData = {
      page: '/docs/test',
      category: 'Bug',
      comment: 'Test feedback',
      timestamp: new Date().toISOString(),
    };

    linearConnector.setDetectionResult(true);
    astroDbConnector.setDetectionError(new Error('Detection failed'));

    const result = await handler.processFeedback(feedback);

    expect(result.success).toBe(true); // Linear should still work
    expect(result.results).toHaveLength(1);
    expect(result.results[0].connector).toBe('linear');
  });
});