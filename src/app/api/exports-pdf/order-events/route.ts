import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { OrderEvent } from '@/lib/types';
import { getUserServerContext } from '@/lib/exports/authz';
import { Timestamp } from 'firebase-admin/firestore';
import { can } from '@/lib/permissions';
import { buildPdf } from '@/lib/exports/pdf-builder';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const userContext = await getUserServerContext(req);
    if (!userContext) {
      return new NextResponse(JSON.stringify({ message: 'No autorizado' }), { status: 401 });
    }

    const { role, companyId, appUser } = userContext;
    if (!can(role, 'operator')) {
      return new NextResponse(JSON.stringify({ message: 'No tienes permiso para exportar a PDF.' }), { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return new NextResponse(JSON.stringify({ message: 'El parámetro "orderId" es requerido.' }), { status: 400 });
    }

    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    const orderData = orderDoc.data();
    if (!orderDoc.exists || !orderData || orderData.companyId !== companyId) {
      return new NextResponse(JSON.stringify({ message: 'Orden no encontrada o no autorizada.' }), { status: 404 });
    }

    const limit = parseInt(searchParams.get('limit') || '500', 10);
    if (isNaN(limit) || limit <= 0 || limit > 2000) {
      return new NextResponse(JSON.stringify({ message: 'El parámetro "limit" es inválido (max 2000).' }), { status: 400 });
    }

    const query = adminDb
      .collection('orders').doc(orderId).collection('events')
      .orderBy('createdAt', 'asc')
      .limit(limit);
      
    const snapshot = await query.get();
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<OrderEvent, 'id'> }));

    const filename = `flux-order-${orderId}-events.pdf`;

    const data = records.map(r => ({
        ...r,
        createdAt: r.createdAt ? format(r.createdAt.toDate(), 'dd/MM/yy HH:mm:ss') : 'N/A',
        createdBy: r.createdBy.slice(0, 8) + '...'
    }));

    const columns = [
      { key: 'createdAt', label: 'Fecha y Hora', width: 100 },
      { key: 'type', label: 'Tipo de Evento', width: 80 },
      { key: 'message', label: 'Mensaje', width: 250 },
      { key: 'createdBy', label: 'Usuario', width: 80 },
    ];
    
    const buffer = await buildPdf({
        rows: data,
        columns,
        meta: {
            companyName: appUser.displayName || companyId,
            reportTitle: `Línea de Tiempo de la Orden`,
            reportSubtitle: `Eventos para la orden #${orderData.orderNumber || orderId}`,
            dateRange: `Hasta ${format(new Date(), 'yyyy-MM-dd')}`
        },
        branding: { mode: 'corporate' }
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (e: any) {
    console.error('Error en exportación PDF de eventos:', e);
    const status = e.message.includes('No autorizado') ? 401 : e.message.includes('No tienes permiso') ? 403 : e.message.includes('no encontrada') ? 404 : 500;
    return new NextResponse(JSON.stringify({ message: e.message || 'Error interno del servidor' }), { status });
  }
}
