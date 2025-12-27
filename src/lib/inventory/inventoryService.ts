import {
  doc,
  collection,
  serverTimestamp,
  runTransaction,
  increment,
  type Firestore,
  setDoc,
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
 * 3. Updates the KPI snapshot for critical stock.
 * 4. Updates the onboarding checklist.
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
  const kpiRef = doc(db, 'kpi_snapshots', companyId);
  const checklistRef = doc(db, 'onboarding_checklists', companyId);

  try {
    await runTransaction(db, async (transaction) => {
      const balanceDoc = await transaction.get(balanceRef);
      const kpiUpdates: { [key: string]: any } = { updatedAt: serverTimestamp() };
      
      if (!balanceDoc.exists()) {
        // If balance doesn't exist, create it.
        transaction.set(balanceRef, {
          companyId,
          warehouseId,
          clientId,
          sku: sku.trim().toLowerCase(),
          qty: qty, // Set initial quantity
          reservedQty: 0,
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        });
        if (qty === 0) {
           kpiUpdates.criticalStockItems = increment(1);
        }

      } else {
        const currentQty = balanceDoc.data().qty || 0;
        transaction.update(balanceRef, {
          qty: increment(qty),
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        });

        if (currentQty === 0 && qty > 0) {
            kpiUpdates.criticalStockItems = increment(-1);
        }
      }

      // Create the inventory ledger entry for this movement.
      transaction.set(ledgerRef, {
        companyId,
        warehouseId,
        clientId,
        sku: sku.trim().toLowerCase(),
        deltaQty: qty, // Positive for inbound
        type: 'inbound',
        refType: 'manual',
        note: note || 'Recepción de stock manual.',
        createdAt: serverTimestamp(),
        createdBy: userId,
      });

      // Update KPIs
      transaction.set(kpiRef, kpiUpdates, { merge: true });

      // Update onboarding checklist
      const checklistSnap = await transaction.get(checklistRef);
      if (checklistSnap.exists() && !checklistSnap.data().steps.moveInventory) {
        transaction.update(checklistRef, {
          'steps.moveInventory': true,
          updatedAt: serverTimestamp(),
        });
      }
    });
    console.log('[Inventory] Movement registered successfully.');
  } catch (error) {
    console.error("Error en la transacción de recepción de stock:", error);
    throw new Error("La operación de recepción de stock falló. Por favor, inténtalo de nuevo.");
  }
}
