import {
  doc,
  setDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  collection,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

type CreateProductData = {
  companyId: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
};

/**
 * Creates a new product.
 * Validates for uniqueness of SKU within the same company.
 * Updates the onboarding checklist.
 */
export async function createProduct(
  db: Firestore,
  data: CreateProductData
): Promise<void> {
  const { companyId, sku, name, description, price } = data;

  const q = query(
    collection(db, 'products'),
    where('companyId', '==', companyId),
    where('sku', '==', sku)
  );
  const existingProductSnap = await getDocs(q);
  if (!existingProductSnap.empty) {
    throw new Error(`Ya existe un producto con el SKU "${sku}" en esta compañía.`);
  }

  const batch = writeBatch(db);

  const productRef = doc(collection(db, 'products'));
  batch.set(productRef, {
    companyId,
    sku,
    name,
    description: description || '',
    price,
    createdAt: serverTimestamp(),
  });

  // Update onboarding checklist
  const checklistRef = doc(db, 'onboarding_checklists', companyId);
  batch.update(checklistRef, { 'steps.createProduct': true, updatedAt: serverTimestamp() });
  
  await batch.commit();
}
