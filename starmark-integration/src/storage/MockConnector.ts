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

  async detect(): Promise<boolean> {
    // Always available in development/test environments
    return true;
  }

  async health(): Promise<boolean> {
    // Always healthy
    return true;
  }

  async store(feedback: FeedbackData): Promise<StorageResult> {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Store feedback in memory
    this.feedbackHistory.push(feedback);
    this.feedbackCount++;

    const id = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
    const pageStats: Array<{ page: string; count: number }> = [];

    // Analyze stored feedback
    this.feedbackHistory.forEach((feedback) => {
      // Count categories
      categoryCount[feedback.category] =
        (categoryCount[feedback.category] || 0) + 1;

      // Count pages
      const existing = pageStats.find((stat) => stat.page === feedback.page);
      if (existing) {
        existing.count++;
      } else {
        pageStats.push({ page: feedback.page, count: 1 });
      }
    });

    return {
      totalFeedback: this.feedbackCount,
      categories: categoryCount,
      pageStats: pageStats.sort((a, b) => b.count - a.count),
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
