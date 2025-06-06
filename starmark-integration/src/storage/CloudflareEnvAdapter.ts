export interface CloudflareContext {
  env?: Record<string, string>;
}

export interface EnvironmentValidation {
  isValid: boolean;
  missing: string[];
  present: string[];
}

export class CloudflareEnvAdapter {
  /**
   * Get environment variables from either Cloudflare context or process.env
   */
  getEnvironmentVariables(
    context?: CloudflareContext | null,
  ): Record<string, string | undefined> {
    if (this.isCloudflareEnvironment(context)) {
      return context!.env!;
    }
    return process.env;
  }

  /**
   * Get a specific environment variable by key
   */
  getEnv(key: string, context?: CloudflareContext | null): string | undefined {
    if (this.isCloudflareEnvironment(context)) {
      return context!.env![key];
    }
    return process.env[key];
  }

  /**
   * Check if we're running in a Cloudflare environment based on context
   */
  isCloudflareEnvironment(context?: CloudflareContext | null): boolean {
    return Boolean(context?.env && typeof context.env === "object");
  }

  /**
   * Check if we're running on Cloudflare based on runtime environment variables
   */
  isRunningOnCloudflare(): boolean {
    // Cloudflare Pages and Workers have specific environment variables
    return Boolean(
      process.env.CF_PAGES || process.env.WORKER || process.env.CF_WORKER,
    );
  }

  /**
   * Validate that required environment variables are present
   */
  validateEnvironmentVariables(
    required: string[],
    context?: CloudflareContext | null,
  ): EnvironmentValidation {
    const env = this.getEnvironmentVariables(context);
    const missing: string[] = [];
    const present: string[] = [];

    for (const key of required) {
      if (env[key]) {
        present.push(key);
      } else {
        missing.push(key);
      }
    }

    return {
      isValid: missing.length === 0,
      missing,
      present,
    };
  }

  /**
   * Create a typed configuration object from environment variables
   */
  createConfig<T extends Record<string, any>>(
    schema: Record<keyof T, string>,
    context?: CloudflareContext | null,
  ): Partial<T> {
    const config: Partial<T> = {};
    const env = this.getEnvironmentVariables(context);

    for (const [configKey, envKey] of Object.entries(schema)) {
      const value = env[envKey];
      if (value) {
        (config as any)[configKey] = value;
      }
    }

    return config;
  }

  /**
   * Get Linear configuration from environment
   */
  getLinearConfig(context?: CloudflareContext | null) {
    return this.createConfig<{
      apiKey: string;
      teamId: string;
      projectId?: string;
    }>(
      {
        apiKey: "LINEAR_API_KEY",
        teamId: "LINEAR_TEAM_ID",
        projectId: "LINEAR_PROJECT_ID",
      },
      context,
    );
  }

  /**
   * Get Auth0 configuration from environment
   */
  getAuth0Config(context?: CloudflareContext | null) {
    return this.createConfig<{
      domain: string;
      clientId: string;
      clientSecret: string;
      audience: string;
    }>(
      {
        domain: "AUTH0_DOMAIN",
        clientId: "AUTH0_CLIENT_ID",
        clientSecret: "AUTH0_CLIENT_SECRET",
        audience: "AUTH0_AUDIENCE",
      },
      context,
    );
  }
}
