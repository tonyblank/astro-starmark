import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { LinearConnector } from '../src/storage/LinearConnector';
import type { FeedbackData } from '../src/types';

// Mock server for Linear GraphQL API
const server = setupServer(
  http.post('https://api.linear.app/graphql', async ({ request }) => {
    const body = await request.json() as any;
    const query = body.query;
    
    if (query.includes('issueCreate')) {
      return HttpResponse.json({
        data: {
          issueCreate: {
            success: true,
            issue: {
              id: 'linear-issue-123',
              title: '[Feedback] Test Issue',
              url: 'https://linear.app/starmark/issue/TEST-123'
            }
          }
        }
      });
    }
    
    // Health check query
    if (query.includes('viewer')) {
      return HttpResponse.json({
        data: {
          viewer: {
            id: 'viewer-123',
            name: 'Test User'
          }
        }
      });
    }
    
    return HttpResponse.json({ errors: [{ message: 'Unknown query' }] }, { status: 400 });
  })
);

describe('LinearConnector', () => {
  let connector: LinearConnector;
  const testConfig = {
    apiKey: 'test-linear-api-key',
    teamId: 'test-team-id',
  };

  beforeEach(() => {
    server.listen();
    connector = new LinearConnector(testConfig);
  });

  afterEach(() => {
    server.resetHandlers();
    server.close();
  });

  test('should have correct name', () => {
    expect(connector.name).toBe('linear');
  });

  test('should detect availability when API key and team ID are configured', async () => {
    const isAvailable = await connector.detect();
    expect(isAvailable).toBe(true);
  });

  test('should not detect availability when API key is missing', async () => {
    const connectorWithoutKey = new LinearConnector({ apiKey: '', teamId: 'test-team' });
    const isAvailable = await connectorWithoutKey.detect();
    expect(isAvailable).toBe(false);
  });

  test('should store feedback as Linear issue', async () => {
    const feedback: FeedbackData = {
      page: '/docs/getting-started',
      category: 'Typo',
      comment: 'There is a typo in the first paragraph',
      timestamp: new Date().toISOString(),
      userAgent: 'Mozilla/5.0 (test)',
      highlightedText: 'selected text with typo',
    };

    const result = await connector.store(feedback);

    expect(result.success).toBe(true);
    expect(result.id).toBe('linear-issue-123');
    expect(result.metadata).toEqual({
      issueUrl: 'https://linear.app/starmark/issue/TEST-123',
      issueTitle: '[Feedback] Test Issue',
    });
  });

  test('should format issue title correctly', async () => {
    const feedback: FeedbackData = {
      page: '/docs/api/authentication',
      category: 'Confusing',
      comment: 'This section needs clarification',
      timestamp: new Date().toISOString(),
    };

    // Mock the GraphQL request to capture the payload
    let capturedPayload: any;
    server.use(
      http.post('https://api.linear.app/graphql', async ({ request }) => {
        capturedPayload = await request.json();
        return HttpResponse.json({
          data: {
            issueCreate: {
              success: true,
              issue: {
                id: 'test-issue',
                title: '[Feedback] Confusing: API Authentication',
                url: 'https://linear.app/test'
              }
            }
          }
        });
      })
    );

    await connector.store(feedback);

    expect(capturedPayload.variables.input.title).toMatch(/\[Feedback\] Confusing: .*/);
  });

  test('should include highlighted text in issue description', async () => {
    const feedback: FeedbackData = {
      page: '/docs/test',
      category: 'Typo',
      comment: 'Fix this typo',
      timestamp: new Date().toISOString(),
      highlightedText: 'text with typo',
    };

    let capturedPayload: any;
    server.use(
      http.post('https://api.linear.app/graphql', async ({ request }) => {
        capturedPayload = await request.json();
        return HttpResponse.json({
          data: {
            issueCreate: {
              success: true,
              issue: { id: 'test', title: 'test', url: 'test' }
            }
          }
        });
      })
    );

    await connector.store(feedback);

    expect(capturedPayload.variables.input.description).toContain('text with typo');
  });

  test('should handle Linear API errors gracefully', async () => {
    server.use(
      http.post('https://api.linear.app/graphql', () => {
        return HttpResponse.json(
          { errors: [{ message: 'Authentication failed' }] },
          { status: 401 }
        );
      })
    );

    const feedback: FeedbackData = {
      page: '/docs/test',
      category: 'Bug',
      comment: 'Test comment',
      timestamp: new Date().toISOString(),
    };

    const result = await connector.store(feedback);

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toContain('401');
    expect(result.retryable).toBe(false); // Auth errors shouldn't be retried
  });

  test('should handle network errors as retryable', async () => {
    server.use(
      http.post('https://api.linear.app/graphql', () => {
        return HttpResponse.error();
      })
    );

    const feedback: FeedbackData = {
      page: '/docs/test',
      category: 'Bug',
      comment: 'Test comment',
      timestamp: new Date().toISOString(),
    };

    const result = await connector.store(feedback);

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.retryable).toBe(true);
  });

  test('should check health successfully', async () => {
    const isHealthy = await connector.health();
    expect(isHealthy).toBe(true);
  });

  test('should report unhealthy when API is down', async () => {
    server.use(
      http.post('https://api.linear.app/graphql', () => {
        return HttpResponse.error();
      })
    );

    const isHealthy = await connector.health();
    expect(isHealthy).toBe(false);
  });
});