import type {
  StorageConnector,
  StorageResult,
  FeedbackData,
  AnalyticsData,
} from "../types";

export interface AstroDbDependencies {
  db: any;
  Feedback: any;
  sql: any;
}

export class AstroDbConnector implements StorageConnector {
  public readonly name = "astrodb";

  private db: any;
  private Feedback: any;
  private sql: any;
  private isInitialized = false;

  constructor(deps?: AstroDbDependencies) {
    if (deps) {
      // For testing - inject dependencies directly
      this.db = deps.db;
      this.Feedback = deps.Feedback;
      this.sql = deps.sql;
      this.isInitialized = true;
    }
  }

  private async initializeDb() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Dynamic import to avoid build errors when @astrojs/db is not available
      const dbModule = await import("astro:db");
      this.db = dbModule.db;
      this.Feedback = dbModule.Feedback;
      this.sql = dbModule.sql;
      this.isInitialized = true;
    } catch (error) {
      // Astro DB is not available - will be handled in detect()
      console.warn("Astro DB not available:", error);
    }
  }

  async detect(): Promise<boolean> {
    try {
      // Ensure DB is initialized
      if (!this.db || !this.Feedback) {
        await this.initializeDb();
      }
      // If we have both db and Feedback table, we're good to go
      return Boolean(this.db && this.Feedback);
    } catch {
      return false;
    }
  }

  async health(): Promise<boolean> {
    try {
      if (!this.db || !this.Feedback || !this.sql) {
        return false;
      }

      // Simple health check: try to count rows
      await this.db.select({ count: this.sql.count() }).from(this.Feedback);
      return true;
    } catch {
      return false;
    }
  }

  async store(feedback: FeedbackData): Promise<StorageResult> {
    try {
      if (!this.db || !this.Feedback) {
        throw new Error("Astro DB not initialized");
      }

      const id = this.generateId();
      const feedbackRecord = {
        id,
        page: feedback.page,
        category: feedback.category,
        comment: feedback.comment || null,
        highlightedText: feedback.highlightedText || null,
        sectionId: feedback.sectionId || null,
        userAgent: feedback.userAgent || null,
        userId: feedback.userId || null,
        userEmail: feedback.userEmail || null,
        timestamp: feedback.timestamp,
        createdAt: new Date(),
      };

      await this.db.insert(this.Feedback).values(feedbackRecord);

      return {
        success: true,
        id: id,
        metadata: {
          tableName: "Feedback",
          insertedAt: feedbackRecord.createdAt.toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        retryable: true, // Database errors are generally retryable
      };
    }
  }

  async getAnalytics(): Promise<AnalyticsData> {
    try {
      if (!this.db || !this.Feedback || !this.sql) {
        throw new Error("Astro DB not initialized");
      }

      // Get total feedback count
      const totalResult = await this.db
        .select({ count: this.sql.count() })
        .from(this.Feedback);

      const totalFeedback = totalResult[0]?.count || 0;

      // Get category counts
      const categoryResult = await this.db
        .select({
          category: this.Feedback.category,
          count: this.sql.count(),
        })
        .from(this.Feedback)
        .groupBy(this.Feedback.category);

      const categories: Record<string, number> = {};
      categoryResult.forEach((row: any) => {
        categories[row.category] = row.count;
      });

      // Get page stats (top 10 pages by feedback count)
      const pageResult = await this.db
        .select({
          page: this.Feedback.page,
          count: this.sql.count(),
        })
        .from(this.Feedback)
        .groupBy(this.Feedback.page)
        .orderBy(this.sql.desc(this.sql.count()))
        .limit(10);

      const pageStats = pageResult.map((row: any) => ({
        page: row.page,
        count: row.count,
      }));

      return {
        totalFeedback,
        categories,
        pageStats,
      };
    } catch (error) {
      console.warn("Failed to get analytics from Astro DB:", error);
      // Return empty analytics on error
      return {
        totalFeedback: 0,
        categories: {},
        pageStats: [],
      };
    }
  }

  private generateId(): string {
    // Generate a unique ID using crypto.randomUUID (Node.js 14.17+)
    // Fallback to timestamp + random for older Node versions
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return `feedback_${crypto.randomUUID()}`;
    }
    // Fallback for environments without crypto.randomUUID
    return `feedback_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}
