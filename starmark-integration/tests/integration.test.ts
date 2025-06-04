import { describe, test, expect } from 'vitest';
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

  test('should reject invalid configuration', () => {
    // Invalid linear config (missing required fields)
    const invalidConfig = {
      linear: {
        apiKey: '', // Empty string should be invalid
      },
    };
    
    expect(() => StarMarkConfigSchema.parse(invalidConfig)).toThrow();
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
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    };

    // Should not throw when calling the hook
    expect(() => {
      integration.hooks['astro:config:setup'](mockContext as any);
    }).not.toThrow();
  });

  test('should handle invalid config gracefully in hooks', () => {
    const integration = starmark({
      linear: {
        apiKey: '', // Invalid config
        teamId: '',
      },
    } as any);
    
    const mockContext = {
      config: {},
      updateConfig: () => {},
      addRenderer: () => {},
      injectScript: () => {},
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    };

    // Should not throw even with invalid config
    expect(() => {
      integration.hooks['astro:config:setup'](mockContext as any);
    }).not.toThrow();
  });
}); 