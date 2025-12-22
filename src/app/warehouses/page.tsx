import AppLayout from '@/components/app-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export default function WarehousesPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Almacenes</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Manage Warehouses</CardTitle>
            <CardDescription>This is where you will manage your warehouses and locations.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Warehouse management functionality will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
