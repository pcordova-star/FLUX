'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase-admin/firestore';

// Set credentials directly for the server-side admin SDK
process.env.FIREBASE_PROJECT_ID = "studio-7575474202-582d8";
process.env.FIREBASE_CLIENT_EMAIL = "firebase-adminsdk-g1q4r@studio-7575474202-582d8.iam.gserviceaccount.com";
// WARNING: In a real production environment, use a secure way to manage private keys.
process.env.FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCp4F9XyJ9Zt8i8\\nB2f0vC3P2eY5Z8i/e2b6Z3b3Y5j8Z9i6f8V7e3f8b3c6X5g6g7h8k9l5a4c3e2f1\\nb3d8e9f8a7c6d5e4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0\\nd9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8\\nf7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6\\ns5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4\\nf3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2\\nb1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0\\nd9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8\\nf7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6\\ns5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4\\nf3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2\\nb1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0\\nd9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8\\nf7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6\\ns5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4\\nf3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2\\nb1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0\\nd9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8\\nf7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6\\ns5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4\\nf3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2\\nb1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0\\nd9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8\\nf7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6\\ns5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4\\nf3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2\\nb1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0\\nd9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8\\nf7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6\\ns5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4\\nf3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2\\nb1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0\\nd9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8\\nf7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6\\ns5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4\\nf3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2\\nb1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0\\nd9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8\\nf7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6\\ns5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4\\nf3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2\\nb1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0\\nd9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8\\nf7a6s5d4f3a2b1c_PRIVATE_KEY-----".replace(/\\n/g, '\n');

export async function seedDatabase() {
  try {
    console.log('[ServerActionDiag] Attempting to run seedDatabase action.');
    console.log(`[ServerActionDiag] Admin SDK Project ID: ${adminDb.app.options.projectId}`);
    
    const batch = adminDb.batch();

    // 1. Create a default company
    const companyId = 'company_1';
    const companyRef = adminDb.collection('companies').doc(companyId);
    batch.set(companyRef, {
      name: 'FLUX Default Company',
      createdAt: Timestamp.now(),
    });
    console.log(`[ServerActionDiag] Staged creation of company: ${companyId}`);

    // 2. Create the specific admin user document
    const userId = 'IPRsFUkbSYfJ7HbARLapmBb1C2';
    const userRef = adminDb.collection('users').doc(userId);
    batch.set(userRef, {
      uid: userId,
      email: 'usuario@correo.com',
      displayName: 'Admin User',
      role: 'admin',
      companyId: companyId,
      isActive: true,
      createdAt: Timestamp.now(),
    });
    console.log(`[ServerActionDiag] Staged creation of user: ${userId}`);

    // 3. Log the seed operation
    const seedLogRef = adminDb.collection('seed_log').doc();
    batch.set(seedLogRef, {
      seededAt: Timestamp.now(),
      status: 'success',
      description: 'Acción de inicialización de la base de datos realizada.',
      details: `Created company '${companyId}' and user '${userId}'.`,
    });

    // Commit all operations atomically
    await batch.commit();
    
    console.log('[ServerActionDiag] Database seeded successfully at', new Date());

    // Revalidate the path to show updated data if you were displaying logs.
    revalidatePath('/admin/seed');
    
    return { success: true, message: 'Base de datos inicializada correctamente con compañía y usuario admin.' };
  } catch (error) {
    console.error('[ServerActionDiag] Error seeding database:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    return { success: false, message: `Fallo al inicializar la base de datos: ${errorMessage}` };
  }
}
