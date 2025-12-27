'use client';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { seedDatabase } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';
import { Loader2, DatabaseZap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function SeedPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleSeed = () => {
    startTransition(async () => {
      const result = await seedDatabase();
      if (result.success) {
        toast({
          title: 'Éxito',
          description: result.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    });
  };

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Consola de Administración</h1>
        </div>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Inicializar Base de Datos (Demo)</CardTitle>
            <CardDescription>
              Hemos cargado datos de ejemplo para que veas cómo funciona el sistema. Puedes eliminarlos cuando quieras.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Acción de Alto Privilegio</AlertTitle>
              <AlertDescription>
                Esta operación escribe directamente en la base de datos utilizando credenciales de administrador y solo debe ser ejecutada una vez en un proyecto nuevo.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Al hacer clic, se crearán atómicamente:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Una compañía de demostración.</li>
                <li>Tres usuarios con roles (admin, operator, viewer).</li>
                <li>Un almacén principal.</li>
                <li>Tres productos con diferentes niveles de stock.</li>
                <li>Dos órdenes de ejemplo (una abierta, una completada).</li>
                <li>Un snapshot de KPIs inicializado.</li>
              </ul>
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSeed} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <DatabaseZap className="mr-2 h-4 w-4" />
              )}
              {isPending ? 'Inicializando...' : 'Poblar con Datos Demo'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}
