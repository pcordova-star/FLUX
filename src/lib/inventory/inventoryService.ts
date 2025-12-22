import {
  doc,
  collection,
  serverTimestamp,
  runTransaction,
  increment,
  type Firestore,
} from 'firebase/firestore';

interface ReceiveStockInput {
  companyId: string;
  warehouseId: string;
  clientId: string;
  sku: string;
  qty: number;
  note?: string;
}

/**
 * Sanitizes a string to be used as a Firestore document ID.
 * Replaces invalid characters (including whitespace) with underscores.
 */
function sanitizeDocId(id: string): string {
    return id.replace(/[.*~/[\]\s]/g, '_');
}

/**
 * Processes a stock receipt transaction. It atomically:
 * 1. Upserts the inventory balance for a given SKU.
 * 2. Creates a ledger entry to record the movement.
 */
export async function receiveStock(db: Firestore, input: ReceiveStockInput, userId: string): Promise<void> {
  const { companyId, warehouseId, clientId, sku, qty, note } = input;

  if (qty <= 0) {
    throw new Error('La cantidad debe ser positiva.');
  }

  // Use a sanitized, deterministic ID for the balance document.
  // SKU is trimmed and lower-cased for consistency.
  const balanceId = sanitizeDocId(`${companyId}_${warehouseId}_${clientId}_${sku.trim().toLowerCase()}`);
  const balanceRef = doc(db, 'inventory_balances', balanceId);
  const ledgerRef = doc(collection(db, 'inventory_ledger'));

  try {
    await runTransaction(db, async (transaction) => {
      const balanceDoc = await transaction.get(balanceRef);
      const currentQty = balanceDoc.exists() ? balanceDoc.data().qty : 0;

      if (!balanceDoc.exists()) {
        // If balance doesn't exist, create it.
        transaction.set(balanceRef, {
          companyId,
          warehouseId,
          clientId,
          sku,
          qty: qty, // Set initial quantity
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        });
      } else {
        // If balance exists, increment the quantity.
        transaction.update(balanceRef, {
          qty: increment(qty),
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        });
      }

      // Create the inventory ledger entry for this movement.
      transaction.set(ledgerRef, {
        companyId,
        warehouseId,
        clientId,
        sku,
        deltaQty: qty, // Positive for inbound
        type: 'inbound',
        refType: 'manual',
        note: note || 'Recepción de stock manual.',
        createdAt: serverTimestamp(),
        createdBy: userId,
      });
    });
  } catch (error) {
    console.error("Error en la transacción de recepción de stock:", error);
    throw new Error("La operación falló. Por favor, inténtalo de nuevo.");
  }
}
