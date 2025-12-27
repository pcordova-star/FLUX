'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/app-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useFirebase } from '@/context/firebase-provider';
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { CreateProductDialog } from '@/components/products/create-product-dialog';
import type { Product } from '@/lib/types';
import PageSpinner from '@/components/page-spinner';
import { can } from '@/lib/permissions';

export default function ProductsPage() {
  const { companyId, loading: authLoading, role } = useAuth();
  const { firestore } = useFirebase();
  const [isCreateProductOpen, setCreateProductOpen] = useState(false);

  const productsQuery = useMemo(() => {
    if (!companyId || !firestore) return null;
    return query(collection(firestore, 'products'), where('companyId', '==', companyId));
  }, [companyId, firestore]);

  const [productsSnapshot, loading, error] = useCollection(productsQuery);
  const products = productsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)) || [];
  
  const canCreateProduct = can(role, 'product:edit');

  if (authLoading) return <PageSpinner />;

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          {canCreateProduct && (
            <Button onClick={() => setCreateProductOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          )}
        </div>
        
        {canCreateProduct && (
          <CreateProductDialog isOpen={isCreateProductOpen} onOpenChange={setCreateProductOpen} />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Catálogo de Productos</CardTitle>
            <CardDescription>Aquí es donde gestionarás tu catálogo de productos.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            {error && <p className="text-destructive">Error al cargar productos: {error.message}</p>}
            {!loading && products.length === 0 && (
              <p className="text-muted-foreground text-center py-10">No se encontraron productos.</p>
            )}
            {!loading && products.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Creado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.sku}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {product.createdAt ? format(product.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
