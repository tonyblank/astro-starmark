// Schema definition for Astro DB
// This file defines the table structure that should be added to the consuming project's db/config.ts

/**
 * Astro DB schema for StarMark feedback
 *
 * Add this to your project's db/config.ts:
 *
 * import { defineDb, defineTable, column } from 'astro:db';
 * import { FeedbackTable } from '@starmark/integration/schema';
 *
 * export default defineDb({
 *   tables: {
 *     Feedback: FeedbackTable,
 *     // ... your other tables
 *   }
 * });
 */

// We can't import from 'astro:db' here as it's not available in the plugin context
// Instead, we export the schema definition for users to copy

export const FeedbackTableSchema = {
  columns: {
    id: { type: "text", primaryKey: true },
    page: { type: "text", notNull: true },
    category: { type: "text", notNull: true },
    comment: { type: "text", optional: true },
    highlightedText: { type: "text", optional: true },
    sectionId: { type: "text", optional: true },
    userAgent: { type: "text", optional: true },
    userId: { type: "text", optional: true },
    userEmail: { type: "text", optional: true },
    timestamp: { type: "text", notNull: true }, // ISO string
    createdAt: { type: "date", notNull: true, default: "CURRENT_TIMESTAMP" },
  },
};

/**
 * Example usage in consuming project's db/config.ts:
 *
 * ```typescript
 * import { defineDb, defineTable, column } from 'astro:db';
 *
 * const Feedback = defineTable({
 *   columns: {
 *     id: column.text({ primaryKey: true }),
 *     page: column.text({ notNull: true }),
 *     category: column.text({ notNull: true }),
 *     comment: column.text({ optional: true }),
 *     highlightedText: column.text({ optional: true }),
 *     sectionId: column.text({ optional: true }),
 *     userAgent: column.text({ optional: true }),
 *     userId: column.text({ optional: true }),
 *     userEmail: column.text({ optional: true }),
 *     timestamp: column.text({ notNull: true }),
 *     createdAt: column.date({ notNull: true, default: sql`CURRENT_TIMESTAMP` }),
 *   }
 * });
 *
 * export default defineDb({
 *   tables: { Feedback }
 * });
 * ```
 */
