import { describe, test, expect, beforeEach } from 'vitest';
import { CloudflareEnvAdapter, type CloudflareContext } from '../src/storage/CloudflareEnvAdapter';

describe('CloudflareEnvAdapter', () => {
  let adapter: CloudflareEnvAdapter;

  beforeEach(() => {
    adapter = new CloudflareEnvAdapter();
    // Reset process.env for each test
    delete process.env.TEST_VAR;
  });

  test('should get environment variables from process.env when no context provided', () => {
    process.env.TEST_VAR = 'test-value';
    
    const envVars = adapter.getEnvironmentVariables();
    
    expect(envVars.TEST_VAR).toBe('test-value');
  });

  test('should get environment variables from Cloudflare context when provided', () => {
    const mockContext = {
      env: {
        LINEAR_API_KEY: 'cf-linear-key',
        LINEAR_TEAM_ID: 'cf-team-id',
        AUTH0_DOMAIN: 'cf.auth0.com',
      }
    };

    const envVars = adapter.getEnvironmentVariables(mockContext);

    expect(envVars.LINEAR_API_KEY).toBe('cf-linear-key');
    expect(envVars.LINEAR_TEAM_ID).toBe('cf-team-id');
    expect(envVars.AUTH0_DOMAIN).toBe('cf.auth0.com');
  });

  test('should detect Cloudflare environment correctly', () => {
    // Test with Cloudflare context
    const cfContext = { env: { SOME_VAR: 'value' } };
    expect(adapter.isCloudflareEnvironment(cfContext)).toBe(true);

    // Test without context
    expect(adapter.isCloudflareEnvironment(null)).toBe(false);
    expect(adapter.isCloudflareEnvironment(undefined)).toBe(false);

    // Test with invalid context
    expect(adapter.isCloudflareEnvironment({})).toBe(false);
    expect(adapter.isCloudflareEnvironment({ notEnv: {} } as any)).toBe(false);
  });

  test('should get specific environment variable by key', () => {
    const mockContext = {
      env: {
        SECRET_KEY: 'secret-value',
        PUBLIC_VAR: 'public-value',
      }
    };

    expect(adapter.getEnv('SECRET_KEY', mockContext)).toBe('secret-value');
    expect(adapter.getEnv('PUBLIC_VAR', mockContext)).toBe('public-value');
    expect(adapter.getEnv('NONEXISTENT', mockContext)).toBeUndefined();
  });

  test('should fall back to process.env when getting specific variable and no context', () => {
    process.env.FALLBACK_VAR = 'fallback-value';

    expect(adapter.getEnv('FALLBACK_VAR')).toBe('fallback-value');
    expect(adapter.getEnv('NONEXISTENT')).toBeUndefined();
  });

  test('should handle missing env object in context gracefully', () => {
    const invalidContext = { notEnv: {} } as unknown as CloudflareContext;

    expect(adapter.getEnvironmentVariables(invalidContext)).toEqual(process.env);
    expect(adapter.getEnv('ANY_VAR', invalidContext)).toBeUndefined();
  });

  test('should provide runtime environment detection', () => {
    // Mock CF environment variables
    const originalCF = process.env.CF_PAGES;
    const originalWorker = process.env.WORKER;

    try {
      // Test CF Pages detection
      process.env.CF_PAGES = '1';
      expect(adapter.isRunningOnCloudflare()).toBe(true);

      delete process.env.CF_PAGES;
      process.env.WORKER = 'true';
      expect(adapter.isRunningOnCloudflare()).toBe(true);

      // Test non-CF environment
      delete process.env.WORKER;
      expect(adapter.isRunningOnCloudflare()).toBe(false);
    } finally {
      // Restore original values
      if (originalCF) process.env.CF_PAGES = originalCF;
      else delete process.env.CF_PAGES;
      
      if (originalWorker) process.env.WORKER = originalWorker;
      else delete process.env.WORKER;
    }
  });

  test('should validate required environment variables', () => {
    const mockContext = {
      env: {
        LINEAR_API_KEY: 'key123',
        LINEAR_TEAM_ID: 'team456',
        // AUTH0_DOMAIN missing
      }
    };

    const required = ['LINEAR_API_KEY', 'LINEAR_TEAM_ID', 'AUTH0_DOMAIN'];
    const validation = adapter.validateEnvironmentVariables(required, mockContext);

    expect(validation.isValid).toBe(false);
    expect(validation.missing).toEqual(['AUTH0_DOMAIN']);
    expect(validation.present).toEqual(['LINEAR_API_KEY', 'LINEAR_TEAM_ID']);
  });

  test('should validate successfully when all required variables present', () => {
    const mockContext = {
      env: {
        LINEAR_API_KEY: 'key123',
        LINEAR_TEAM_ID: 'team456',
        AUTH0_DOMAIN: 'test.auth0.com',
      }
    };

    const required = ['LINEAR_API_KEY', 'LINEAR_TEAM_ID', 'AUTH0_DOMAIN'];
    const validation = adapter.validateEnvironmentVariables(required, mockContext);

    expect(validation.isValid).toBe(true);
    expect(validation.missing).toEqual([]);
    expect(validation.present).toEqual(['LINEAR_API_KEY', 'LINEAR_TEAM_ID', 'AUTH0_DOMAIN']);
  });
});