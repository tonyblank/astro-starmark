import { describe, test, expect, vi } from 'vitest';
import { starmark, StarMarkConfigSchema } from '../src/index.js';

describe('StarMark Integration', () => {
  test('should export the main integration function', () => {
    expect(starmark).toBeDefined();
    expect(typeof starmark).toBe('function');
  });

  test('should export the configuration schema', () => {
    expect(StarMarkConfigSchema).toBeDefined();
    expect(typeof StarMarkConfigSchema.parse).toBe('function');
  });

  test('should create integration with default config', () => {
    const integration = starmark();
    
    expect(integration).toBeDefined();
    expect(integration.name).toBe('starmark');
    expect(integration.hooks).toBeDefined();
    expect(integration.hooks['astro:config:setup']).toBeDefined();
    expect(integration.hooks['astro:config:done']).toBeDefined();
  });

  test('should create integration with valid config', () => {
    const config = {
      debug: true,
      ui: {
        categories: ['Bug', 'Feature'],
        position: 'bottom-right' as const,
      },
    };

    const integration = starmark(config);
    
    expect(integration).toBeDefined();
    expect(integration.name).toBe('starmark');
  });

  test('should validate configuration schema correctly', () => {
    // Valid minimal config
    expect(() => StarMarkConfigSchema.parse({})).not.toThrow();
    
    // Valid full config
    const fullConfig = {
      linear: {
        apiKey: 'test-key',
        teamId: 'test-team',
      },
      auth0: {
        domain: 'test.auth0.com',
        clientId: 'test-client',
        clientSecret: 'test-secret',
      },
      ui: {
        categories: ['Bug', 'Feature'],
        position: 'bottom-right',
        theme: {
          primary: '#007acc',
        },
      },
      debug: true,
    };
    
    expect(() => StarMarkConfigSchema.parse(fullConfig)).not.toThrow();
  });

  test('should accept empty strings in configuration (CI-friendly)', () => {
    // Empty strings should now be valid at schema level
    const configWithEmptyStrings = {
      linear: {
        apiKey: '', // Empty strings should be valid for CI/CD
        teamId: '',
      },
      auth0: {
        domain: '',
        clientId: '',
        clientSecret: '',
      },
    };
    
    expect(() => StarMarkConfigSchema.parse(configWithEmptyStrings)).not.toThrow();
  });

  test('should handle integration hooks without crashing', () => {
    const integration = starmark({ debug: true });
    
    // Mock the Astro config setup context
    const mockContext = {
      config: {},
      updateConfig: () => {},
      addRenderer: () => {},
      injectScript: () => {},
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    };

    // Should not throw when calling the hook
    expect(() => {
      const setupHook = integration.hooks['astro:config:setup'];
      if (setupHook) {
        setupHook(mockContext as any);
      }
    }).not.toThrow();
  });

  test('should warn about empty config values but not fail', () => {
    const mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const integration = starmark({
      linear: {
        apiKey: '', // Empty config should warn but not fail
        teamId: '',
      },
      auth0: {
        domain: '',
        clientId: '',
        clientSecret: '',
      },
    });
    
    const mockContext = {
      config: {},
      updateConfig: () => {},
      addRenderer: () => {},
      injectScript: () => {},
      logger: mockLogger,
    };

    // Should not throw with empty config (warn instead)
    expect(() => {
      const setupHook = integration.hooks['astro:config:setup'];
      if (setupHook) {
        setupHook(mockContext as any);
      }
    }).not.toThrow();

    // Should have logged warnings
    expect(mockLogger.warn).toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith('StarMark integration configuration warnings:');
  });

  test('should handle structural errors properly', () => {
    const mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const integration = starmark({
      ui: {
        categories: ['Bug', 'Feature'],
        position: 'invalid-position' as any,
      },
    });
    
    const mockContext = {
      config: {},
      updateConfig: () => {},
      addRenderer: () => {},
      injectScript: () => {},
      logger: mockLogger,
    };

    // Should throw with structural validation errors
    expect(() => {
      const setupHook = integration.hooks['astro:config:setup'];
      if (setupHook) {
        setupHook(mockContext as any);
      }
    }).toThrow('StarMark integration failed: Invalid configuration structure');
  });
}); 