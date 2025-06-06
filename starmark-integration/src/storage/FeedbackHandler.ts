import type { FeedbackData, StorageConnector } from "../types";
import { StorageRegistry } from "./StorageRegistry";
import { CloudflareEnvAdapter } from "./CloudflareEnvAdapter";

export interface FeedbackHandlerResult {
  success: boolean;
  correlationId: string;
  results: Array<{
    connector: string;
    success: boolean;
    id?: string;
    error?: string;
    retryable?: boolean;
    healthy?: boolean;
    metadata?: Record<string, any>;
  }>;
  error?: string;
}

export class FeedbackHandler {
  private registry: StorageRegistry;

  constructor(registry: StorageRegistry) {
    this.registry = registry;
  }

  /**
   * Process feedback through all available storage connectors
   */
  async processFeedback(
    feedback: FeedbackData,
  ): Promise<FeedbackHandlerResult> {
    const correlationId = this.generateCorrelationId();

    try {
      // Discover available connectors
      const availableConnectors = await this.registry.detectAvailable();

      if (availableConnectors.length === 0) {
        return {
          success: false,
          correlationId,
          error: "No storage connectors available",
          results: [],
        };
      }

      // Process feedback through all available connectors in parallel
      const results = await Promise.allSettled(
        availableConnectors.map((connector) =>
          this.processWithConnector(connector, feedback),
        ),
      );

      // Transform results
      const processedResults = results.map((result, index) => {
        const connector = availableConnectors[index];

        if (result.status === "fulfilled") {
          return {
            connector: connector.name,
            ...result.value,
          };
        } else {
          return {
            connector: connector.name,
            success: false,
            error: result.reason?.message || "Unknown error",
            retryable: true,
            healthy: false,
          };
        }
      });

      // Check if at least one connector succeeded
      const hasSuccess = processedResults.some((r) => r.success);

      return {
        success: hasSuccess,
        correlationId,
        results: processedResults,
      };
    } catch (error) {
      return {
        success: false,
        correlationId,
        error: error instanceof Error ? error.message : "Unknown error",
        results: [],
      };
    }
  }

  /**
   * Get health status of all registered connectors
   */
  async getHealthStatus(): Promise<Map<string, boolean>> {
    return await this.registry.checkHealth();
  }

  /**
   * Get all registered connectors (for debugging)
   */
  getRegisteredConnectors(): string[] {
    return this.registry.getAllConnectors().map((c) => c.name);
  }

  /**
   * Process feedback with a single connector
   */
  private async processWithConnector(
    connector: StorageConnector,
    feedback: FeedbackData,
  ): Promise<{
    success: boolean;
    id?: string;
    error?: string;
    retryable?: boolean;
    healthy?: boolean;
    metadata?: Record<string, any>;
  }> {
    try {
      // Check connector health
      const isHealthy = await connector.health();

      // Store feedback
      const result = await connector.store(feedback);

      return {
        success: result.success,
        id: result.id,
        error: result.error?.message,
        retryable: result.retryable,
        healthy: isHealthy,
        metadata: result.metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        retryable: true,
        healthy: false,
      };
    }
  }

  /**
   * Generate a correlation ID for tracking
   */
  private generateCorrelationId(): string {
    // Simple UUID v4-like implementation
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }

  /**
   * Create a configured FeedbackHandler with connectors based on environment
   */
  static async createFromEnvironment(context?: {
    astrodb?: { db: any; Feedback: any; sql: any };
    cloudflare?: { env?: Record<string, string> };
    [key: string]: any;
  }): Promise<FeedbackHandler> {
    const envAdapter = new CloudflareEnvAdapter();
    const registry = new StorageRegistry();

    // Import connectors dynamically to avoid bundling issues
    const { LinearConnector } = await import("./LinearConnector");
    const { AstroDbConnector } = await import("./AstroDbConnector");
    const { MockConnector } = await import("./MockConnector");

    let hasRealConnector = false;

    // Configure Linear connector if credentials are available
    const linearConfig = envAdapter.getLinearConfig(context?.cloudflare);
    if (linearConfig.apiKey && linearConfig.teamId) {
      const linearConnector = new LinearConnector({
        apiKey: linearConfig.apiKey,
        teamId: linearConfig.teamId,
        projectId: linearConfig.projectId,
      });
      registry.register(linearConnector);
      hasRealConnector = true;
    }

    // Configure Astro DB connector if dependencies are provided
    if (context?.astrodb) {
      const astroDbConnector = new AstroDbConnector(context.astrodb);
      const astroDbAvailable = await astroDbConnector.detect();
      if (astroDbAvailable) {
        registry.register(astroDbConnector);
        hasRealConnector = true;
      }
    }

    // If no real connectors are available, use Mock connector for development/testing
    if (!hasRealConnector) {
      console.log(
        "No storage connectors available, using Mock connector for development/testing",
      );
      const mockConnector = new MockConnector();
      registry.register(mockConnector);
    }

    return new FeedbackHandler(registry);
  }
}
