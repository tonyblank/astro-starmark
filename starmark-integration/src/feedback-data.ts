import { z } from "zod";

// Category enum for feedback types
export const FeedbackCategory = z.enum([
  "Bug",
  "Feature Request",
  "Question",
  "Typo",
  "Confusing",
  "Outdated",
  "Missing",
  "Other",
]);

export type FeedbackCategoryType = z.infer<typeof FeedbackCategory>;

// Comprehensive feedback data schema with validation
export const FeedbackSchema = z.object({
  // Required fields
  page: z
    .string()
    .min(1, "Page path is required")
    .regex(/^\//, "Page must start with / (relative path)"),
  category: FeedbackCategory,
  comment: z
    .string()
    .min(1, "Comment is required")
    .max(5000, "Comment must be less than 5000 characters"),
  timestamp: z.string().datetime({
    message: "Timestamp must be a valid ISO datetime",
  }),
  userAgent: z.string().optional(),

  // Optional fields
  highlightedText: z.string().optional(),
  sectionId: z.string().optional(),
  suggestedTag: z
    .string()
    .max(100, "Suggested tag must be less than 100 characters")
    .optional(),
  userEmail: z.string().email("Must be a valid email address").optional(),
  userId: z.string().optional(),
  userName: z
    .string()
    .max(200, "User name must be less than 200 characters")
    .optional(),
});

export type FeedbackData = z.infer<typeof FeedbackSchema>;

// Schema for API responses
export const FeedbackSubmissionResponseSchema = z.object({
  success: z.boolean(),
  id: z.string().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
  retryable: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

export type FeedbackSubmissionResponse = z.infer<
  typeof FeedbackSubmissionResponseSchema
>;

// Schema for multiple connector results (for future use)
export const ConnectorResultSchema = z.object({
  connectorName: z.string(),
  success: z.boolean(),
  id: z.string().optional(),
  error: z.string().optional(),
  retryable: z.boolean().optional(),
});

export type ConnectorResult = z.infer<typeof ConnectorResultSchema>;

export const MultipleFeedbackResponseSchema = z.object({
  success: z.boolean(),
  overallId: z.string().optional(),
  results: z.array(ConnectorResultSchema),
  message: z.string().optional(),
});

export type MultipleFeedbackResponse = z.infer<
  typeof MultipleFeedbackResponseSchema
>;

// Utility functions for creating feedback data
export function createFeedbackData(
  page: string,
  category: FeedbackCategoryType,
  comment: string,
  options: {
    highlightedText?: string;
    sectionId?: string;
    suggestedTag?: string;
    userEmail?: string;
    userName?: string;
  } = {},
): FeedbackData {
  return {
    page,
    category,
    comment,
    timestamp: new Date().toISOString(),
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    ...options,
  };
}

export function validateFeedbackData(data: unknown): FeedbackData {
  return FeedbackSchema.parse(data);
}

export function isValidFeedbackData(data: unknown): data is FeedbackData {
  try {
    FeedbackSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}
