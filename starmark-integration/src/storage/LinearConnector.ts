import type { StorageConnector, StorageResult, FeedbackData } from "../types";

export interface LinearConfig {
  apiKey: string;
  teamId: string;
  projectId?: string;
}

export class LinearConnector implements StorageConnector {
  public readonly name = "linear";
  private readonly apiKey: string;
  private readonly teamId: string;
  private readonly projectId?: string;
  private readonly baseUrl = "https://api.linear.app/graphql";

  constructor(config: LinearConfig) {
    this.apiKey = config.apiKey;
    this.teamId = config.teamId;
    this.projectId = config.projectId;
  }

  async detect(): Promise<boolean> {
    return Boolean(this.apiKey && this.teamId);
  }

  async health(): Promise<boolean> {
    try {
      const response = await this.makeRequest(`
        query {
          viewer {
            id
            name
          }
        }
      `);

      return Boolean(response.data?.viewer);
    } catch {
      return false;
    }
  }

  async store(feedback: FeedbackData): Promise<StorageResult> {
    try {
      const title = this.formatIssueTitle(feedback);
      const description = this.formatIssueDescription(feedback);

      const mutation = `
        mutation CreateFeedbackIssue($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            success
            issue {
              id
              title
              url
            }
          }
        }
      `;

      const variables = {
        input: {
          teamId: this.teamId,
          title,
          description,
          ...(this.projectId && { projectId: this.projectId }),
          labelIds: this.getLabelIds(feedback.category),
        },
      };

      const response = await this.makeRequest(mutation, variables);

      if (response.data?.issueCreate?.success) {
        const issue = response.data.issueCreate.issue;
        return {
          success: true,
          id: issue.id,
          metadata: {
            issueUrl: issue.url,
            issueTitle: issue.title,
          },
        };
      }

      throw new Error(
        response.errors?.[0]?.message || "Failed to create Linear issue",
      );
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        retryable: this.isRetryableError(error),
      };
    }
  }

  private async makeRequest(query: string, variables?: any): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      throw new Error(data.errors[0].message);
    }

    return data;
  }

  private formatIssueTitle(feedback: FeedbackData): string {
    const pageName = this.extractPageName(feedback.page);
    return `[Feedback] ${feedback.category}: ${pageName}`;
  }

  private extractPageName(pagePath: string): string {
    // Extract meaningful name from path like "/docs/api/authentication" -> "API Authentication"
    const segments = pagePath.split("/").filter(Boolean);
    if (segments.length === 0) return "Homepage";

    // Remove 'docs' prefix if present and capitalize remaining segments
    const meaningfulSegments = segments.filter((segment) => segment !== "docs");
    return meaningfulSegments
      .map((segment) =>
        segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
      )
      .join(" ");
  }

  private formatIssueDescription(feedback: FeedbackData): string {
    let description = `**Page:** ${feedback.page}\n`;
    description += `**Category:** ${feedback.category}\n`;
    description += `**Timestamp:** ${feedback.timestamp}\n\n`;

    if (feedback.highlightedText) {
      description += `**Selected Text:**\n> ${feedback.highlightedText}\n\n`;
    }

    if (feedback.comment) {
      description += `**User Comment:**\n${feedback.comment}\n\n`;
    }

    if (feedback.userAgent) {
      description += `**User Agent:** ${feedback.userAgent}\n`;
    }

    description += `\n---\n*This issue was automatically created from user feedback via StarMark.*`;

    return description;
  }

  private getLabelIds(_category: string): string[] {
    // In a real implementation, you might map categories to Linear label IDs
    // For now, return empty array as labels are optional
    return [];
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Network errors and 5xx errors are retryable
      if (
        error.message.includes("fetch") ||
        error.message.includes("network")
      ) {
        return true;
      }

      // Rate limiting errors are retryable
      if (
        error.message.includes("rate limit") ||
        error.message.includes("429")
      ) {
        return true;
      }

      // Authentication/authorization errors are not retryable
      if (
        error.message.includes("Authentication") ||
        error.message.includes("401") ||
        error.message.includes("403")
      ) {
        return false;
      }
    }

    return true; // Default to retryable for unknown errors
  }
}
