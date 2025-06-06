import type { StorageConnector } from "../types";

export class StorageRegistry {
  private connectors: Map<string, StorageConnector> = new Map();

  /**
   * Register a storage connector
   */
  register(connector: StorageConnector): void {
    this.connectors.set(connector.name, connector);
  }

  /**
   * Get a connector by name
   */
  getByName(name: string): StorageConnector | null {
    return this.connectors.get(name) || null;
  }

  /**
   * Get all registered connectors
   */
  getAllConnectors(): StorageConnector[] {
    return Array.from(this.connectors.values());
  }

  /**
   * Auto-discover available connectors by calling their detect() method
   */
  async detectAvailable(): Promise<StorageConnector[]> {
    const available: StorageConnector[] = [];

    for (const connector of this.connectors.values()) {
      try {
        const isAvailable = await connector.detect();
        if (isAvailable) {
          available.push(connector);
        }
      } catch (error) {
        // Log error but continue with other connectors
        console.warn(
          `Detection failed for connector '${connector.name}':`,
          error,
        );
      }
    }

    return available;
  }

  /**
   * Check health of all registered connectors
   */
  async checkHealth(): Promise<Map<string, boolean>> {
    const healthResults = new Map<string, boolean>();

    for (const connector of this.connectors.values()) {
      try {
        const isHealthy = await connector.health();
        healthResults.set(connector.name, isHealthy);
      } catch (error) {
        console.warn(
          `Health check failed for connector '${connector.name}':`,
          error,
        );
        healthResults.set(connector.name, false);
      }
    }

    return healthResults;
  }
}
