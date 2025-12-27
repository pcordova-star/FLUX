'use client';

import React, { useEffect } from 'react';
import AppLayout from '@/components/app-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Package, ShoppingCart, Warehouse } from 'lucide-react';
import { useFirebase } from '@/context/firebase-provider';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';

export default function DashboardPage() {
  const { firestore } = useFirebase();
  const { user } = useAuth();

  useEffect(() => {
    const runHealthCheck = async () => {
      // Run check only if firestore and user are available
      if (!firestore || !user) return;
      
      try {
        // Ping the user's own document, which should always be readable by them
        const userDocRef = doc(firestore, "users", user.uid);
        await getDoc(userDocRef);
        console.log("%c[FirebaseDiag] Firestore ping successful! (read users/self)", "color: green");
      } catch (error: any) {
        console.error("[FirebaseDiag] Raw error:", error);
        console.error(
          "%c[FirebaseDiag] Firestore ping failed.", "color: red",
          {
            name: error?.name,
            message: error?.message,
            code: error?.code,
            stack: error?.stack,
            toString: String(error),
          }
        );
         if (error?.customData) {
            console.error("[FirebaseDiag] Custom Data:", error.customData);
        }
      }
    };
    runHealthCheck();
  }, [firestore, user]);


  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Activos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">+5% desde el mes pasado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Artículos de Inventario</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5,678</div>
              <p className="text-xs text-muted-foreground">Total de productos únicos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Almacenes</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Ubicaciones en línea</p>
            </CardContent>
          </Card>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Bienvenido a FLUX Wems Core</CardTitle>
                <CardDescription>
                Este es tu centro de control para gestionar operaciones de almacén, pedidos e inventario.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>Usa la navegación de la izquierda para acceder a los diferentes módulos del sistema. Puedes ver pedidos, gestionar niveles de stock, configurar productos y más.</p>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
