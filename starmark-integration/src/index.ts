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
      apiKey: z.string().min(1, "Linear API key is required"),
      teamId: z.string().min(1, "Linear team ID is required"),
    })
    .optional(),

  /**
   * Auth0 configuration for user authentication
   */
  auth0: z
    .object({
      domain: z.string().min(1, "Auth0 domain is required"),
      clientId: z.string().min(1, "Auth0 client ID is required"),
      clientSecret: z.string().min(1, "Auth0 client secret is required"),
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
          // Validate configuration
          const validatedConfig = StarMarkConfigSchema.parse(config);

          if (validatedConfig.debug) {
            logger.info("StarMark integration initialized in debug mode");
            console.log("StarMark config:", validatedConfig);
          }

          // TODO: Add client scripts for the feedback widget
          // TODO: Add API routes for handling feedback submission
          // TODO: Set up authentication middleware if Auth0 is configured
          // TODO: Configure Linear/GitHub connectors

          logger.info(
            "StarMark integration loaded successfully (no-op for now)",
          );
        } catch (error) {
          // Abort integration on validation failure - don't risk runtime errors
          if (error instanceof z.ZodError) {
            logger.error("StarMark integration configuration error:");
            logger.error(JSON.stringify(error.errors, null, 2));
            logger.error(
              "StarMark integration aborted due to configuration errors",
            );
            throw new Error(
              `StarMark integration failed: Invalid configuration. ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
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

// Default export for convenience
export default starmark;
