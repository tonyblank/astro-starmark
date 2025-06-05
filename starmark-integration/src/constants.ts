/**
 * Shared constants for StarMark feedback system
 */

/**
 * Default categories for feedback submissions.
 * These categories are used by both the widget and modal to ensure consistency.
 */
export const DEFAULT_FEEDBACK_CATEGORIES = [
  "Bug",
  "Feature Request",
  "Question",
  "Typo",
  "Confusing",
  "Other",
] as const;

/**
 * Type for feedback category values
 */
export type FeedbackCategory = (typeof DEFAULT_FEEDBACK_CATEGORIES)[number];
