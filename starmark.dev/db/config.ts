import { defineDb, defineTable, column, sql } from 'astro:db';

// Feedback table for StarMark integration
const Feedback = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    page: column.text({ notNull: true }),
    category: column.text({ notNull: true }),
    comment: column.text({ optional: true }),
    highlightedText: column.text({ optional: true }),
    sectionId: column.text({ optional: true }),
    userAgent: column.text({ optional: true }),
    userId: column.text({ optional: true }),
    userEmail: column.text({ optional: true }),
    timestamp: column.text({ notNull: true }),
    createdAt: column.date({ notNull: true, default: sql`CURRENT_TIMESTAMP` }),
  }
});

export default defineDb({
  tables: { Feedback }
});