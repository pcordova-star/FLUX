import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Order } from '@/lib/types';
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

    const adminDb = getAdminDb();
    const { role, companyId, appUser } = userContext;
    if (!can(role, 'operator')) {
      return new NextResponse(JSON.stringify({ message: 'No tienes permiso para exportar a PDF.' }), { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    if (isNaN(limit) || limit <= 0 || limit > 2000) {
      return new NextResponse(JSON.stringify({ message: 'El parámetro "limit" es inválido (max 2000).' }), { status: 400 });
    }

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb
      .collection('orders')
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (from) query = query.where('createdAt', '>=', Timestamp.fromDate(new Date(from)));
    if (to) query = query.where('createdAt', '<=', Timestamp.fromDate(new Date(to)));
    if (status) query = query.where('status', '==', status);

    const snapshot = await query.get();
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<Order, 'id'> }));
    
    const fromStr = from ? format(new Date(from), 'yyyy-MM-dd') : 'inicio';
    const toStr = to ? format(new Date(to), 'yyyy-MM-dd') : 'fin';
    const filename = `flux-orders-${fromStr}-a-${toStr}.pdf`;

    const data = records.map(r => ({
      ...r,
      createdAt: r.createdAt ? format(r.createdAt.toDate(), 'dd/MM/yy HH:mm') : 'N/A',
      promiseAt: r.promiseAt ? format(r.promiseAt.toDate(), 'dd/MM/yy') : 'N/A',
      itemsJson: r.items.map(item => `${item.sku}(${item.qty})`).join(', '),
    }));

    const columns = [
      { key: 'createdAt', label: 'Fecha Creado', width: 70 },
      { key: 'orderNumber', label: 'Nº Orden', width: 80 },
      { key: 'status', label: 'Estado', width: 60 },
      { key: 'totalItems', label: 'Items', width: 35, align: 'right' as const },
      { key: 'totalUnits', label: 'Und.', width: 35, align: 'right' as const },
      { key: 'promiseAt', label: 'F. Promesa', width: 60 },
      { key: 'itemsJson', label: 'Contenido', width: 150 },
    ];
    
    // Summary Calculation (in-memory)
    const statusCounts = records.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const summary = [
        { label: 'Total de Pedidos', value: records.length.toString() },
        { label: 'Pedidos Creados', value: (statusCounts['created'] || 0).toString() },
        { label: 'Pedidos Despachados', value: (statusCounts['shipped'] || 0).toString() },
        { label: 'Pedidos Entregados', value: (statusCounts['delivered'] || 0).toString() },
    ];


    const buffer = await buildPdf({
        rows: data, 
        columns,
        meta: {
            companyName: appUser.displayName || companyId,
            reportTitle: 'Reporte de Pedidos',
            reportSubtitle: 'Un resumen de los pedidos de salida registrados en el sistema.',
            dateRange: `${fromStr} a ${toStr}`
        },
        summary,
        branding: { mode: 'corporate' },
        notes: [
            'Este reporte muestra los pedidos registrados dentro del rango de fechas especificado.',
            'Los estados reflejan la última actualización de cada pedido al momento de la generación del reporte.'
        ]
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (e: any) {
    console.error('Error en exportación PDF de pedidos:', e);
    const status = e.message.includes('No autorizado') ? 401 : e.message.includes('No tienes permiso') ? 403 : 500;
    return new NextResponse(JSON.stringify({ message: e.message || 'Error interno del servidor' }), { status });
  }
}
