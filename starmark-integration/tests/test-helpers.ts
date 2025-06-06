import { experimental_AstroContainer as AstroContainer, type ContainerRenderOptions } from 'astro/container';

type AstroComponentFactory = Parameters<AstroContainer['renderToString']>[0];

/**
 * Helper function to render an Astro component for testing
 * Following the latest Astro 5 Container API best practices
 * @param Component - The Astro component to render
 * @param options - Rendering options including props, slots, etc.
 * @returns DOM element that can be queried for testing
 */
export async function renderAstroComponent(
  Component: AstroComponentFactory,
  options: ContainerRenderOptions = {}
) {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Component, options);

  // Create a template element and set innerHTML - best practice from latest docs
  const template = document.createElement('template');
  template.innerHTML = result;
  
  return template.content;
}

/**
 * Helper function to render an Astro component to string for testing
 * @param Component - The Astro component to render
 * @param options - Rendering options including props, slots, etc.
 * @returns HTML string
 */
export async function renderAstroComponentToString(
  Component: AstroComponentFactory,
  options: ContainerRenderOptions = {}
) {
  const container = await AstroContainer.create();
  return await container.renderToString(Component, options);
}

/**
 * Mock Storage Connector for testing
 */
export class MockStorageConnector {
  public name: string;
  private detectionResult: boolean = true;
  private detectionError: Error | null = null;
  private storeResults: import('../src/types').StorageResult[] = [];
  private healthResult: boolean = true;
  private analyticsResult: import('../src/types').AnalyticsData | null = null;

  constructor(name: string) {
    this.name = name;
  }

  async store(_feedback: import('../src/types').FeedbackData): Promise<import('../src/types').StorageResult> {
    if (this.storeResults.length > 0) {
      return this.storeResults.shift()!;
    }
    return {
      success: true,
      id: `${this.name}-${Date.now()}`,
    };
  }

  async health(): Promise<boolean> {
    return this.healthResult;
  }

  async detect(): Promise<boolean> {
    if (this.detectionError) {
      throw this.detectionError;
    }
    return this.detectionResult;
  }

  async getAnalytics?(): Promise<import('../src/types').AnalyticsData> {
    if (this.analyticsResult) {
      return this.analyticsResult;
    }
    return {
      totalFeedback: 42,
      categories: { Typo: 10, Confusing: 15, Other: 17 },
      pageStats: [
        { page: '/docs/test', count: 5 },
        { page: '/docs/example', count: 3 },
      ],
    };
  }

  // Test helper methods
  setDetectionResult(result: boolean): void {
    this.detectionResult = result;
  }

  setDetectionError(error: Error): void {
    this.detectionError = error;
  }

  setHealthResult(result: boolean): void {
    this.healthResult = result;
  }

  setStoreResult(result: import('../src/types').StorageResult): void {
    this.storeResults.push(result);
  }

  setAnalyticsResult(result: import('../src/types').AnalyticsData): void {
    this.analyticsResult = result;
  }
} 