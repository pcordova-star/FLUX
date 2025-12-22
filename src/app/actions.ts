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
      description: 'Acción de inicialización de la base de datos realizada.'
    });
    
    console.log('Base de datos inicializada correctamente en', timestamp);

    // Revalidate the path to show updated data if you were displaying logs.
    revalidatePath('/admin/seed');
    
    return { success: true, message: 'Base de datos inicializada correctamente.' };
  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    return { success: false, message: `Fallo al inicializar la base de datos: ${errorMessage}` };
  }
}
