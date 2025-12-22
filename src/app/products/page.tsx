import AppLayout from '@/components/app-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export default function ProductsPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Manage Products</CardTitle>
            <CardDescription>This is where you will manage your product catalog.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Product management functionality will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
