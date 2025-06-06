import { describe, test, expect, beforeEach, vi } from 'vitest';
import { StorageRegistry } from '../src/storage/StorageRegistry';
import { MockStorageConnector } from './test-helpers';
import type { StorageConnector, StorageResult } from '../src/types';

describe('StorageConnector Interface', () => {
  test('StorageConnector interface has required methods', () => {
    const mockConnector: StorageConnector = {
      name: 'test-connector',
      store: vi.fn().mockResolvedValue({ success: true, id: 'test-123' }),
      health: vi.fn().mockResolvedValue(true),
      detect: vi.fn().mockResolvedValue(true),
    };

    expect(mockConnector.name).toBe('test-connector');
    expect(typeof mockConnector.store).toBe('function');
    expect(typeof mockConnector.health).toBe('function');
    expect(typeof mockConnector.detect).toBe('function');
  });

  test('StorageResult interface has correct structure', () => {
    const successResult: StorageResult = {
      success: true,
      id: 'test-123',
    };

    const errorResult: StorageResult = {
      success: false,
      error: new Error('Test error'),
      retryable: true,
    };

    expect(successResult.success).toBe(true);
    expect(successResult.id).toBe('test-123');
    expect(errorResult.success).toBe(false);
    expect(errorResult.error).toBeInstanceOf(Error);
    expect(errorResult.retryable).toBe(true);
  });
});

describe('StorageRegistry', () => {
  let registry: StorageRegistry;
  let mockConnector1: MockStorageConnector;
  let mockConnector2: MockStorageConnector;

  beforeEach(() => {
    registry = new StorageRegistry();
    mockConnector1 = new MockStorageConnector('linear');
    mockConnector2 = new MockStorageConnector('astrodb');
  });

  test('can register storage connectors', () => {
    registry.register(mockConnector1);
    registry.register(mockConnector2);

    expect(registry.getByName('linear')).toBe(mockConnector1);
    expect(registry.getByName('astrodb')).toBe(mockConnector2);
  });

  test('returns null for unknown connector names', () => {
    registry.register(mockConnector1);
    
    expect(registry.getByName('unknown')).toBeNull();
  });

  test('auto-discovers available connectors', async () => {
    mockConnector1.setDetectionResult(true);
    mockConnector2.setDetectionResult(false);

    registry.register(mockConnector1);
    registry.register(mockConnector2);

    const available = await registry.detectAvailable();
    
    expect(available).toHaveLength(1);
    expect(available[0]).toBe(mockConnector1);
  });

  test('handles detection errors gracefully', async () => {
    mockConnector1.setDetectionResult(true);
    mockConnector2.setDetectionError(new Error('Detection failed'));

    registry.register(mockConnector1);
    registry.register(mockConnector2);

    const available = await registry.detectAvailable();
    
    expect(available).toHaveLength(1);
    expect(available[0]).toBe(mockConnector1);
  });

  test('getAllConnectors returns all registered connectors', () => {
    registry.register(mockConnector1);
    registry.register(mockConnector2);

    const allConnectors = registry.getAllConnectors();
    
    expect(allConnectors).toHaveLength(2);
    expect(allConnectors).toContain(mockConnector1);
    expect(allConnectors).toContain(mockConnector2);
  });
});