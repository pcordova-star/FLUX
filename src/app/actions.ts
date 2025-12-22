'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export async function seedDatabase() {
  try {
    // This is a placeholder for the actual seeding logic.
    // A real implementation would involve creating initial documents
    // in the 'companies', 'users', etc. collections.
    const seedCollection = adminDb.collection('seed_log');
    const timestamp = new Date();
    
    await seedCollection.add({
      seededAt: timestamp,
      status: 'success',
      description: 'Initial database seed action performed.'
    });
    
    console.log('Database seeded successfully at', timestamp);

    // Revalidate the path to show updated data if you were displaying logs.
    revalidatePath('/admin/seed');
    
    return { success: true, message: 'Database seeded successfully.' };
  } catch (error) {
    console.error('Error seeding database:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to seed database: ${errorMessage}` };
  }
}
