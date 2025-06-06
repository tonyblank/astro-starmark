import type { AstroIntegration } from "astro";
import { z } from "zod";

/**
 * Configuration schema for StarMark integration
 */
export const StarMarkConfigSchema = z.object({
  /**
   * Linear integration configuration
   */
  linear: z
    .object({
      apiKey: z.string(),
      teamId: z.string(),
    })
    .optional(),

  /**
   * Auth0 configuration for user authentication
   */
  auth0: z
    .object({
      domain: z.string(),
      clientId: z.string(),
      clientSecret: z.string(),
      audience: z.string().optional(),
    })
    .optional(),

  /**
   * UI configuration options
   */
  ui: z
    .object({
      /**
       * Categories available in the feedback form
       */
      categories: z
        .array(z.string())
        .default(["Bug", "Feature Request", "Question", "Typo"]),

      /**
       * Position of the feedback widget
       */
      position: z
        .enum(["bottom-right", "bottom-left", "top-right", "top-left"])
        .default("bottom-right"),

      /**
       * Custom theme colors
       */
      theme: z
        .object({
          primary: z.string().optional(),
          secondary: z.string().optional(),
        })
        .optional(),
    })
    .default({}),

  /**
   * Enable debug mode for development
   */
  debug: z.boolean().default(false),
});

export type StarMarkConfig = z.infer<typeof StarMarkConfigSchema>;

/**
 * Validate configuration at runtime and provide helpful warnings
 */
function validateRuntimeConfig(
  config: StarMarkConfig,
  logger: { info: (msg: string) => void; warn: (msg: string) => void },
) {
  const warnings: string[] = [];

  // Check Linear configuration
  if (config.linear) {
    if (!config.linear.apiKey || config.linear.apiKey.trim() === "") {
      warnings.push(
        "Linear API key is not configured - Linear integration will be disabled",
      );
    }
    if (!config.linear.teamId || config.linear.teamId.trim() === "") {
      warnings.push(
        "Linear team ID is not configured - Linear integration will be disabled",
      );
    }
  }

  // Check Auth0 configuration
  if (config.auth0) {
    if (!config.auth0.domain || config.auth0.domain.trim() === "") {
      warnings.push(
        "Auth0 domain is not configured - Authentication will be disabled",
      );
    }
    if (!config.auth0.clientId || config.auth0.clientId.trim() === "") {
      warnings.push(
        "Auth0 client ID is not configured - Authentication will be disabled",
      );
    }
    if (!config.auth0.clientSecret || config.auth0.clientSecret.trim() === "") {
      warnings.push(
        "Auth0 client secret is not configured - Authentication will be disabled",
      );
    }
  }

  // Log warnings if any
  if (warnings.length > 0) {
    logger.warn("StarMark integration configuration warnings:");
    warnings.forEach((warning) => logger.warn(`  - ${warning}`));
    logger.info(
      "StarMark will continue with reduced functionality. Set environment variables to enable full features.",
    );
  }

  return warnings;
}

/**
 * StarMark feedback integration for Astro
 *
 * This integration adds a feedback widget to your Astro site that allows
 * users to submit feedback directly to Linear, GitHub, or other configured
 * backends.
 *
 * @param config Configuration object for the integration
 * @returns Astro integration object
 */
export function starmark(
  config: Partial<StarMarkConfig> = {},
): AstroIntegration {
  return {
    name: "starmark",
    hooks: {
      "astro:config:setup": ({ logger }) => {
        try {
          // Validate configuration structure (but allow empty strings)
          const validatedConfig = StarMarkConfigSchema.parse(config);

          // Validate runtime configuration and warn about missing values
          const warnings = validateRuntimeConfig(validatedConfig, logger);

          if (validatedConfig.debug) {
            logger.info("StarMark integration initialized in debug mode");
            console.log("StarMark config:", validatedConfig);
            console.log("Configuration warnings:", warnings);
          }

          logger.info(
            "StarMark integration loaded successfully - use FeedbackWidget component manually for now",
          );
        } catch (error) {
          // Only abort on schema structure errors, not missing values
          if (error instanceof z.ZodError) {
            logger.error("StarMark integration configuration error:");
            logger.error(JSON.stringify(error.errors, null, 2));
            logger.error(
              "StarMark integration aborted due to configuration structure errors",
            );
            throw new Error(
              `StarMark integration failed: Invalid configuration structure. ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
            );
          } else {
            logger.error("StarMark integration error:");
            logger.error(String(error));
            logger.error("StarMark integration aborted");
            throw new Error(`StarMark integration failed: ${String(error)}`);
          }
        }
      },

      "astro:config:done": ({ config, logger }) => {
        if (config.output === "static") {
          logger.warn(
            'StarMark integration works best with server-side rendering (output: "server" or "hybrid")',
          );
        }
      },
    },
  };
}

// Re-export types for consumers
export type { AstroIntegration };

// Re-export feedback data types and schemas
export {
  FeedbackSchema,
  FeedbackSubmissionResponseSchema,
  type FeedbackData,
  type FeedbackSubmissionResponse,
  type FeedbackCategoryType,
  createFeedbackData,
  validateFeedbackData,
  isValidFeedbackData,
} from "./feedback-data";

// Re-export storage types and classes
export {
  type StorageConnector,
  type StorageResult,
  type AnalyticsData,
} from "./types";

export { StorageRegistry } from "./storage/StorageRegistry";
export { FeedbackHandler } from "./storage/FeedbackHandler";
export { LinearConnector } from "./storage/LinearConnector";
export { AstroDbConnector } from "./storage/AstroDbConnector";
export { CloudflareEnvAdapter } from "./storage/CloudflareEnvAdapter";
export { MockConnector } from "./storage/MockConnector";

// Default export for convenience
export default starmark;
