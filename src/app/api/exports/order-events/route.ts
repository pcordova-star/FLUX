import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Order, OrderEvent } from '@/lib/types';
import { getUserServerContext } from '@/lib/exports/authz';
import { buildCsv } from '@/lib/exports/csv';
import { buildExcel } from '@/lib/exports/xlsx';
import { Timestamp } from 'firebase-admin/firestore';
import { can } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const userContext = await getUserServerContext(req);
    if (!userContext) {
      return new NextResponse(JSON.stringify({ message: 'No autorizado' }), { status: 401 });
    }

    const adminDb = getAdminDb();
    const { role, companyId } = userContext;
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
        return new NextResponse(JSON.stringify({ message: 'Se requiere un ID de orden para la exportación.' }), { status: 400 });
    }

    // Security check: ensure order belongs to user's company
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    if (!orderDoc.exists() || orderDoc.data()?.companyId !== companyId) {
        return new NextResponse(JSON.stringify({ message: 'Orden no encontrada o no autorizada.' }), { status: 404 });
    }

    const format = searchParams.get('format') || 'csv';
    const limit = parseInt(searchParams.get('limit') || '1000', 10);

    if (format === 'xlsx' && !can(role, 'operator')) {
        return new NextResponse(JSON.stringify({ message: 'No tienes permiso para exportar a XLSX.' }), { status: 403 });
    }

    if (isNaN(limit) || limit <= 0 || limit > 5000) {
      return new NextResponse(JSON.stringify({ message: 'El parámetro "limit" es inválido.' }), { status: 400 });
    }

    const query = adminDb
      .collection('orders').doc(orderId).collection('events')
      .orderBy('createdAt', 'desc')
      .limit(limit);
    
    const snapshot = await query.get();
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<OrderEvent, 'id'> }));

    const headers = [
      { header: 'ID Evento', key: 'id' },
      { header: 'Fecha', key: 'createdAt' },
      { header: 'Tipo', key: 'type' },
      { header: 'Mensaje', key: 'message' },
      { header: 'Usuario', key: 'createdBy' },
    ];
    
    const data = records.map(r => ({
      ...r,
      createdAt: (r.createdAt as Timestamp)?.toDate().toISOString() ?? '',
    }));

    const filename = `flux-order-${orderId}-events`;

    if (format === 'xlsx') {
      const buffer = await buildExcel(data, headers, 'Eventos Pedido');
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      });
    }

    const csv = buildCsv(data.reverse(), headers); // Chronological for CSV
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    });

  } catch (e: any) {
    console.error('Error en exportación de eventos de pedido:', e);
    if (e.message.includes('No autorizado')) {
      return new NextResponse(JSON.stringify({ message: e.message }), { status: 401 });
    }
    if (e.message.includes('No tienes permiso')) {
      return new NextResponse(JSON.stringify({ message: e.message }), { status: 403 });
    }
    return new NextResponse(JSON.stringify({ message: 'Error interno del servidor' }), { status: 500 });
  }
}
