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
            <CardTitle>Gestionar Almacenes</CardTitle>
            <CardDescription>Aquí es donde gestionarás tus almacenes y ubicaciones.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>La funcionalidad de gestión de almacenes se implementará aquí.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
