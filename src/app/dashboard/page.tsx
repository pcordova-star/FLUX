'use client';

import React from 'react';
import AppLayout from '@/components/app-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ShoppingCart, AlertTriangle, Truck, Repeat, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useFirebase } from '@/context/firebase-provider';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc } from 'firebase/firestore';
import type { KpiSnapshot } from '@/lib/types';
import TimeseriesChart from '@/components/dashboard/timeseries-chart';


function KpiCard({ title, value, icon, description, loading }: { title: string, value: string | number, icon: React.ReactNode, description: string, loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="h-8 w-24 rounded-md bg-muted animate-pulse" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Mock data for charts - to be replaced with data from kpi_snapshots_daily
const ordersData = [
  { date: '2024-05-01', value: 22 },
  { date: '2024-05-02', value: 35 },
  { date: '2024-05-03', value: 28 },
  { date: '2024-05-04', value: 42 },
  { date: '2024-05-05', value: 30 },
  { date: '2024-05-06', value: 50 },
  { date: '2024-05-07', value: 45 },
];

const movementsData = [
  { date: '2024-05-01', value: 150 },
  { date: '2024-05-02', value: 210 },
  { date: '2024-05-03', value: 180 },
  { date: '2024-05-04', value: 250 },
  { date: '2024-05-05', value: 190 },
  { date: '2024-05-06', value: 300 },
  { date: '2024-05-07', value: 280 },
];

export default function DashboardPage() {
  const { firestore } = useFirebase();
  const { companyId } = useAuth();

  const kpiDocRef = companyId ? doc(firestore, 'kpi_snapshots', companyId) : null;
  const [snapshot, loading, error] = useDocument(kpiDocRef);
  const kpis = snapshot?.data() as KpiSnapshot | undefined;

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Ejecutivo</h1>
        </div>
        
        {error && <p className="text-destructive">Error al cargar KPIs: {error.message}</p>}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Órdenes en Curso"
            value={kpis?.ordersInProgress ?? '...'}
            icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
            description="Picking, packed, etc."
            loading={loading}
          />
          <KpiCard
            title="Órdenes Atrasadas"
            value={kpis?.ordersDelayed ?? '...'}
            icon={<Truck className="h-4 w-4 text-muted-foreground" />}
            description="Incumplen fecha promesa"
            loading={loading}
          />
          <KpiCard
            title="Stock Crítico"
            value={kpis?.criticalStockItems ?? '...'}
            icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
            description="SKUs con stock cero"
            loading={loading}
          />
          <KpiCard
            title="Rotación (30d)"
            value={'N/A'}
            icon={<Repeat className="h-4 w-4 text-muted-foreground" />}
            description="KPI calculado (diario)"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TimeseriesChart
            title="Órdenes por Día (Últimos 7 días)"
            data={ordersData}
            dataKey="value"
            xAxisKey="date"
            color="hsl(var(--chart-1))"
          />
           <TimeseriesChart
            title="Movimientos de Inventario (Últimos 7 días)"
            data={movementsData}
            dataKey="value"
            xAxisKey="date"
            color="hsl(var(--chart-2))"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bienvenido a FLUX Wems Core</CardTitle>
            <CardDescription>
              Este es tu centro de control para visualizar las métricas clave de la operación logística.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !kpis && (
                <div className="text-center py-10 text-muted-foreground">
                    <p>Cargando datos del dashboard...</p>
                </div>
            )}
            {!loading && !error && !kpis && (
                <p className="text-muted-foreground">
                    Aún no hay datos de KPI para mostrar. Comienza a operar para ver las métricas aquí.
                </p>
            )}
             {!loading && !error && kpis && (
                <p>Usa este dashboard para tomar decisiones rápidas y supervisar la salud de tu almacén. Los datos se actualizan a medida que tu equipo opera.</p>
             )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
