import type { APIRoute } from "astro";
import {
  FeedbackSchema,
  type FeedbackSubmissionResponse,
  FeedbackHandler,
} from "starmark-integration";

// CORS headers for the API endpoint
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export const POST: APIRoute = async ({ request }) => {
  // Only allow POST method
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed. Only POST requests are supported.",
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }

  try {
    // Parse and validate request body
    let feedbackData;
    try {
      feedbackData = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    // Validate feedback data with Zod schema
    const validatedFeedback = FeedbackSchema.parse(feedbackData);

    // Create feedback handler with environment-based configuration
    // Try to dynamically import Astro DB dependencies with timeout
    let astrodb = undefined;
    try {
      // Add a timeout to prevent hanging during tests
      const astroDbPromise = import("astro:db");
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Astro DB import timeout")), 2000),
      );

      const astroDbModule = await Promise.race([
        astroDbPromise,
        timeoutPromise,
      ]);
      astrodb = {
        db: (astroDbModule as any).db,
        Feedback: (astroDbModule as any).Feedback,
        sql: (astroDbModule as any).sql,
      };
      console.log("Astro DB successfully imported");
    } catch (error) {
      console.log(
        "Astro DB not available, will use fallback storage:",
        (error as Error).message,
      );
    }

    const feedbackHandler = await FeedbackHandler.createFromEnvironment({
      astrodb,
    });

    console.log(
      "Registered storage connectors:",
      feedbackHandler.getRegisteredConnectors(),
    );

    // Process feedback through all available storage connectors
    const result = await feedbackHandler.processFeedback(validatedFeedback);

    console.log("Feedback processed:", {
      correlationId: result.correlationId,
      success: result.success,
      connectorsUsed: result.results.length,
      results: result.results.map((r) => ({
        connector: r.connector,
        success: r.success,
        id: r.id,
        healthy: r.healthy,
      })),
    });

    if (!result.success) {
      const response: FeedbackSubmissionResponse = {
        success: false,
        error: result.error || "Failed to store feedback",
        retryable: result.results.some((r) => r.retryable),
      };

      return new Response(JSON.stringify(response), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    const response: FeedbackSubmissionResponse = {
      success: true,
      id: result.correlationId,
      message: "Feedback submitted successfully",
      metadata: {
        connectorsUsed: result.results.length,
        results: result.results,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    // Handle Zod validation errors or other errors
    let errorMessage = "Invalid feedback data";

    // Check if this is a ZodError with issues array
    if (error && typeof error === "object" && "issues" in error) {
      const issues = (error as { issues: Array<{ message: string }> }).issues;
      if (Array.isArray(issues) && issues.length > 0 && issues[0]?.message) {
        errorMessage = issues[0].message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    const response: FeedbackSubmissionResponse = {
      success: false,
      error: errorMessage,
      retryable: false,
    };

    return new Response(JSON.stringify(response), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
};

// Export OPTIONS handler as well for proper CORS support
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
};
