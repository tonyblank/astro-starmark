import { describe, test, expect, beforeEach, vi } from 'vitest';
import { AstroDbConnector } from '../src/storage/AstroDbConnector';
import type { FeedbackData } from '../src/types';

// Mock Astro DB
const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
};

// Mock the db module from 'astro:db'
vi.mock('astro:db', () => ({
  db: mockDb,
  Feedback: 'mocked-feedback-table',
  sql: {
    count: vi.fn(() => 'count(*)'),
  },
}));

describe('AstroDbConnector', () => {
  let connector: AstroDbConnector;

  beforeEach(() => {
    // Inject mock dependencies for testing
    connector = new AstroDbConnector({
      db: mockDb,
      Feedback: 'mocked-feedback-table',
      sql: {
        count: vi.fn(() => 'count(*)'),
        desc: vi.fn((col) => `desc(${col})`),
      },
    });
    vi.clearAllMocks();
  });

  test('should have correct name', () => {
    expect(connector.name).toBe('astrodb');
  });

  test('should always detect as available', async () => {
    const isAvailable = await connector.detect();
    expect(isAvailable).toBe(true);
  });

  test('should store feedback in database', async () => {
    const feedback: FeedbackData = {
      page: '/docs/getting-started',
      category: 'Typo',
      comment: 'There is a typo here',
      timestamp: new Date().toISOString(),
      userAgent: 'Mozilla/5.0 (test)',
      highlightedText: 'selected text',
      sectionId: 'introduction',
    };

    // Mock successful insert (return value doesn't matter for Astro DB)
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined)
    });

    const result = await connector.store(feedback);

    expect(result.success).toBe(true);
    expect(result.id).toMatch(/^feedback_\d+_[a-z0-9]+$/); // Generated ID pattern
    expect(mockDb.insert).toHaveBeenCalledWith('mocked-feedback-table');
  });

  test('should handle database insert errors', async () => {
    const feedback: FeedbackData = {
      page: '/docs/test',
      category: 'Bug',
      comment: 'Test comment',
      timestamp: new Date().toISOString(),
    };

    // Mock database error
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockRejectedValue(new Error('Database connection failed'))
    });

    const result = await connector.store(feedback);

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('Database connection failed');
    expect(result.retryable).toBe(true);
  });

  test('should check health by querying database', async () => {
    // Mock successful health check
    mockDb.select.mockReturnValue({
      from: vi.fn().mockResolvedValue([{ count: 1 }])
    });

    const isHealthy = await connector.health();

    expect(isHealthy).toBe(true);
    expect(mockDb.select).toHaveBeenCalled();
  });

  test('should report unhealthy when database is unavailable', async () => {
    // Mock database error
    mockDb.select.mockReturnValue({
      from: vi.fn().mockRejectedValue(new Error('Database unavailable'))
    });

    const isHealthy = await connector.health();

    expect(isHealthy).toBe(false);
  });

  test('should get analytics data', async () => {
    // Mock analytics query results with chained methods
    const createMockChain = (resolveValue: any) => ({
      from: vi.fn().mockReturnValue({
        groupBy: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(resolveValue)
          })
        })
      })
    });

    // Mock total count query
    mockDb.select
      .mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([{ count: 150 }])
      })
      // Mock category counts
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockResolvedValue([
            { category: 'Typo', count: 45 },
            { category: 'Confusing', count: 60 },
            { category: 'Bug', count: 30 },
            { category: 'Other', count: 15 },
          ])
        })
      })
      // Mock page stats
      .mockReturnValueOnce(createMockChain([
        { page: '/docs/getting-started', count: 25 },
        { page: '/docs/api/overview', count: 20 },
        { page: '/docs/examples', count: 15 },
      ]));

    const analytics = await connector.getAnalytics();

    expect(analytics.totalFeedback).toBe(150);
    expect(analytics.categories).toEqual({
      Typo: 45,
      Confusing: 60,
      Bug: 30,
      Other: 15,
    });
    expect(analytics.pageStats).toEqual([
      { page: '/docs/getting-started', count: 25 },
      { page: '/docs/api/overview', count: 20 },
      { page: '/docs/examples', count: 15 },
    ]);
  });

  test('should handle analytics query errors gracefully', async () => {
    // Mock database error for analytics
    mockDb.select.mockReturnValue({
      from: vi.fn().mockRejectedValue(new Error('Analytics query failed'))
    });

    const analytics = await connector.getAnalytics();

    // Should return default/empty analytics when query fails
    expect(analytics.totalFeedback).toBe(0);
    expect(analytics.categories).toEqual({});
    expect(analytics.pageStats).toEqual([]);
  });
});