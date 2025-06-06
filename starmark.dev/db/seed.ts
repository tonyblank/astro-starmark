import { db, Feedback, eq } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {
  // Optional: Add sample feedback data for development
  // This will only run when the database is initialized
  
  // Check if seed data already exists to prevent duplicates
  const existing = await db.select().from(Feedback).where(eq(Feedback.comment, 'Sample feedback entry for testing'));
  if (existing.length > 0) {
    console.log('Seed data already exists, skipping...');
    return;
  }
  
  await db.insert(Feedback).values([
    {
      id: `feedback_sample_${Date.now()}`,
      page: '/getting-started/quick-start',
      category: 'Typo',
      comment: 'Sample feedback entry for testing',
      timestamp: new Date().toISOString(),
      createdAt: new Date(),
    }
  ]);
}