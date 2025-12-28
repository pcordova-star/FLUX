import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Order } from '@/lib/types';
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

    const { role, companyId } = userContext;
    const { searchParams } = new URL(req.url);

    const format = searchParams.get('format') || 'csv';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '2000', 10);

    if (format === 'xlsx' && !can(role, 'operator')) {
        return new NextResponse(JSON.stringify({ message: 'No tienes permiso para exportar a XLSX.' }), { status: 403 });
    }

    if (isNaN(limit) || limit <= 0 || limit > 10000) {
      return new NextResponse(JSON.stringify({ message: 'El parámetro "limit" es inválido.' }), { status: 400 });
    }

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb
      .collection('orders')
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (from) {
      query = query.where('createdAt', '>=', Timestamp.fromDate(new Date(from)));
    }
    if (to) {
      query = query.where('createdAt', '<=', Timestamp.fromDate(new Date(to)));
    }
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.get();
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<Order, 'id'> }));

    const headers = [
      { header: 'ID Orden', key: 'id' },
      { header: 'Nº Orden', key: 'orderNumber' },
      { header: 'Estado', key: 'status' },
      { header: 'Almacén', key: 'warehouseId' },
      { header: 'Fecha Creado', key: 'createdAt' },
      { header: 'Fecha Promesa', key: 'promiseAt' },
      { header: 'Prioridad', key: 'priority' },
      { header: 'Total Ítems', key: 'totalItems' },
      { header: 'Total Unidades', key: 'totalUnits' },
      { header: 'ID Cliente', key: 'clientId' },
      { header: 'Creado Por (UID)', key: 'createdBy' },
      { header: 'Ítems (JSON)', key: 'itemsJson' }
    ];
    
    const data = records.map(r => ({
      ...r,
      createdAt: (r.createdAt as Timestamp)?.toDate().toISOString() ?? '',
      promiseAt: (r.promiseAt as Timestamp)?.toDate().toISOString() ?? '',
      itemsJson: JSON.stringify(r.items),
    }));

    const fromStr = from ? new Date(from).toISOString().split('T')[0] : 'inicio';
    const toStr = to ? new Date(to).toISOString().split('T')[0] : 'fin';
    const filename = `flux-orders-${fromStr}-a-${toStr}`;

    if (format === 'xlsx') {
      const buffer = await buildExcel(data, headers, 'Pedidos');
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      });
    }

    const csv = buildCsv(data, headers);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    });

  } catch (e: any) {
    console.error('Error en exportación de pedidos:', e);
    if (e.message.includes('No autorizado')) {
      return new NextResponse(JSON.stringify({ message: e.message }), { status: 401 });
    }
    if (e.message.includes('No tienes permiso')) {
      return new NextResponse(JSON.stringify({ message: e.message }), { status: 403 });
    }
    return new NextResponse(JSON.stringify({ message: 'Error interno del servidor' }), { status: 500 });
  }
}
