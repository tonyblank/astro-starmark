import type { APIRoute } from "astro";
import {
  FeedbackSchema,
  type FeedbackSubmissionResponse,
} from "starmark-integration";
import { v4 as uuidv4 } from "uuid";

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

    // For now, just return success (no actual storage in Milestone 4)
    // In future milestones, this will call connectors to store the feedback
    console.log("Feedback received:", {
      page: validatedFeedback.page,
      category: validatedFeedback.category,
      comment:
        validatedFeedback.comment.substring(0, 100) +
        (validatedFeedback.comment.length > 100 ? "..." : ""),
      timestamp: validatedFeedback.timestamp,
    });

    const response: FeedbackSubmissionResponse = {
      success: true,
      id: `feedback-${uuidv4()}`,
      message: "Feedback submitted successfully",
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
