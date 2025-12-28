import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { OrderEvent } from '@/lib/types';
import { getUserServerContext } from '@/lib/exports/authz';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  try {
    const userContext = await getUserServerContext(req);
    if (!userContext) {
      return new NextResponse(JSON.stringify({ message: 'No autorizado' }), { status: 401 });
    }

    const adminDb = getAdminDb();
    const { companyId } = userContext;
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return new NextResponse(JSON.stringify({ message: 'El parámetro "orderId" es requerido.' }), { status: 400 });
    }

    // Security check: ensure the requested order belongs to the user's company
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    if (!orderDoc.exists || orderDoc.data()?.companyId !== companyId) {
      return new NextResponse(JSON.stringify({ message: 'Orden no encontrada o no autorizada.' }), { status: 404 });
    }

    const limit = parseInt(searchParams.get('limit') || '200', 10);
    if (isNaN(limit) || limit <= 0 || limit > 500) {
      return new NextResponse(JSON.stringify({ message: 'El parámetro "limit" es inválido (max 500).' }), { status: 400 });
    }

    const query = adminDb
      .collection('orders')
      .doc(orderId)
      .collection('events')
      .orderBy('createdAt', 'desc')
      .limit(limit);
    
    const snapshot = await query.get();
    const records = snapshot.docs.map(doc => {
      const data = doc.data() as Omit<OrderEvent, 'id'>;
      return { 
        id: doc.id, 
        ...data,
        // Serialize Timestamps
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : null,
      };
    });

    return NextResponse.json({ data: records.reverse() }); // Reverse to show chronological order

  } catch (e: any) {
    console.error('Error en vista previa de eventos de pedido:', e);
    return new NextResponse(JSON.stringify({ message: e.message || 'Error interno del servidor' }), { status: e.message.includes('No autorizado') ? 401 : 500 });
  }
}
