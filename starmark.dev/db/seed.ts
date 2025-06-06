import { db, Feedback } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {
  // Optional: Add sample feedback data for development
  // This will only run when the database is initialized
  
  await db.insert(Feedback).values([
    {
      id: 'feedback_sample_001',
      page: '/getting-started/quick-start',
      category: 'Typo',
      comment: 'Sample feedback entry for testing',
      timestamp: new Date().toISOString(),
      createdAt: new Date(),
    }
  ]);
}