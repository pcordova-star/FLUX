import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { InventoryLedger } from '@/lib/types';
import { getUserServerContext } from '@/lib/exports/authz';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  try {
    const userContext = await getUserServerContext(req);
    if (!userContext) {
      return new NextResponse(JSON.stringify({ message: 'No autorizado' }), { status: 401 });
    }

    const { companyId } = userContext;
    const { searchParams } = new URL(req.url);

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const warehouseId = searchParams.get('warehouseId');
    const limit = parseInt(searchParams.get('limit') || '200', 10);

    if (isNaN(limit) || limit <= 0 || limit > 500) {
      return new NextResponse(JSON.stringify({ message: 'El parámetro "limit" es inválido (max 500).' }), { status: 400 });
    }

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb
      .collection('inventory_ledger')
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (from) query = query.where('createdAt', '>=', Timestamp.fromDate(new Date(from)));
    if (to) query = query.where('createdAt', '<=', Timestamp.fromDate(new Date(to)));
    if (warehouseId) query = query.where('warehouseId', '==', warehouseId);
    
    const snapshot = await query.get();
    const records = snapshot.docs.map(doc => {
        const data = doc.data() as Omit<InventoryLedger, 'id'>;
        return { 
            id: doc.id, 
            ...data,
            // Serialize Timestamps
            createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : null
        };
    });

    return NextResponse.json({ data: records });

  } catch (e: any) {
    console.error('Error en vista previa de libro mayor:', e);
    return new NextResponse(JSON.stringify({ message: e.message || 'Error interno del servidor' }), { status: e.message.includes('No autorizado') ? 401 : 500 });
  }
}
