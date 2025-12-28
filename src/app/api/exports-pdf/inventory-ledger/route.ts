import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { InventoryLedger } from '@/lib/types';
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
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const warehouseId = searchParams.get('warehouseId');
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    if (isNaN(limit) || limit <= 0 || limit > 2000) {
      return new NextResponse(JSON.stringify({ message: 'El parámetro "limit" es inválido (max 2000).' }), { status: 400 });
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
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<InventoryLedger, 'id'> }));

    const fromStr = from ? format(new Date(from), 'yyyy-MM-dd') : 'inicio';
    const toStr = to ? format(new Date(to), 'yyyy-MM-dd') : 'fin';
    const filename = `flux-ledger-${fromStr}-a-${toStr}.pdf`;
    
    const data = records.map(r => ({
      ...r,
      createdAt: r.createdAt ? format(r.createdAt.toDate(), 'dd/MM/yy HH:mm') : 'N/A',
      deltaQty: r.deltaQty ?? 0,
      reservedDeltaQty: r.reservedDeltaQty ?? 0,
      note: r.note || '',
      createdBy: r.createdBy ? r.createdBy.slice(0, 8) + '...' : 'System'
    }));

    const columns = [
      { key: 'createdAt', label: 'Fecha', width: 70 },
      { key: 'type', label: 'Tipo', width: 60 },
      { key: 'sku', label: 'SKU', width: 90 },
      { key: 'deltaQty', label: 'Delta', width: 40, align: 'right' as const },
      { key: 'warehouseId', label: 'Almacén', width: 70 },
      { key: 'note', label: 'Nota', width: 100 },
      { key: 'createdBy', label: 'Usuario', width: 60 },
    ];
    
    // Summary Calculation (in-memory)
    const totalInbound = records.reduce((acc, r) => (r.type === 'inbound' && r.deltaQty ? acc + r.deltaQty : acc), 0);
    const totalOutbound = records.reduce((acc, r) => (r.type === 'outbound' && r.deltaQty ? acc + Math.abs(r.deltaQty) : acc), 0);
    const summary = [
        { label: 'Registros Exportados', value: records.length.toString() },
        { label: 'Unidades Entrantes', value: totalInbound.toString() },
        { label: 'Unidades Salientes', value: totalOutbound.toString() },
    ];

    const buffer = await buildPdf({
        rows: data, 
        columns,
        meta: {
            companyName: appUser.displayName || companyId,
            reportTitle: 'Reporte de Movimientos de Inventario',
            reportSubtitle: 'Un registro detallado de todas las transacciones de stock.',
            dateRange: `${fromStr} a ${toStr}`
        },
        summary,
        branding: { mode: 'corporate' },
        notes: [
            'Este documento es una representación de los movimientos de inventario registrados en el sistema.',
            'Las cantidades reflejan los deltas aplicados al stock. Para el saldo final, consulte el reporte de saldos.'
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
    console.error('Error en exportación PDF de libro mayor:', e);
    const status = e.message.includes('No autorizado') ? 401 : e.message.includes('No tienes permiso') ? 403 : 500;
    return new NextResponse(JSON.stringify({ message: e.message || 'Error interno del servidor' }), { status });
  }
}
