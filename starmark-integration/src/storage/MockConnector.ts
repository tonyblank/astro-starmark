import type {
  StorageConnector,
  StorageResult,
  FeedbackData,
  AnalyticsData,
} from "../types";

/**
 * Mock storage connector for testing and development
 * Always succeeds and logs feedback data to console
 */
export class MockConnector implements StorageConnector {
  name = "mock";
  private feedbackCount = 0;
  private feedbackHistory: FeedbackData[] = [];
  private latencyMs: number;

  constructor(latencyMs = 0) {
    this.latencyMs = latencyMs;
  }

  async detect(): Promise<boolean> {
    // Always available in development/test environments
    return true;
  }

  async health(): Promise<boolean> {
    // Always healthy
    return true;
  }

  async store(feedback: FeedbackData): Promise<StorageResult> {
    // Simulate processing time if latency is enabled
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }

    // Store feedback in memory
    this.feedbackHistory.push(feedback);
    this.feedbackCount++;

    const id = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    console.log("Mock Connector: Feedback stored successfully", {
      id,
      feedback,
      totalCount: this.feedbackCount,
    });

    return {
      success: true,
      id,
      metadata: {
        connector: "mock",
        timestamp: new Date().toISOString(),
        totalFeedbackProcessed: this.feedbackCount,
      },
    };
  }

  async getAnalytics(): Promise<AnalyticsData> {
    const categoryCount: Record<string, number> = {};
    const pageCounts = new Map<string, number>();

    // Analyze stored feedback
    this.feedbackHistory.forEach((feedback) => {
      // Count categories
      categoryCount[feedback.category] =
        (categoryCount[feedback.category] || 0) + 1;

      // Count pages efficiently using Map
      pageCounts.set(feedback.page, (pageCounts.get(feedback.page) ?? 0) + 1);
    });

    // Convert Map to sorted array
    const pageStats = [...pageCounts]
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalFeedback: this.feedbackCount,
      categories: categoryCount,
      pageStats,
    };
  }

  /**
   * Get all stored feedback (for testing purposes)
   */
  getFeedbackHistory(): FeedbackData[] {
    return [...this.feedbackHistory];
  }

  /**
   * Clear all stored feedback (for testing purposes)
   */
  clearHistory(): void {
    this.feedbackHistory = [];
    this.feedbackCount = 0;
  }
}
