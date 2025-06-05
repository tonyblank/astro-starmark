import type { APIRoute } from "astro";
import {
  FeedbackSchema,
  type FeedbackSubmissionResponse,
} from "starmark-integration";

// CORS headers for the API endpoint
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export const POST: APIRoute = async ({ request }) => {
  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

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
      id: `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
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

    if (error instanceof Error) {
      // For Zod errors, provide specific validation messages
      try {
        const zodError = JSON.parse(error.message);
        if (Array.isArray(zodError) && zodError[0]?.message) {
          errorMessage = zodError[0].message;
        } else {
          errorMessage = error.message;
        }
      } catch {
        errorMessage = error.message;
      }
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
