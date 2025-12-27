'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/auth-context';
import { useFirebase } from '@/context/firebase-provider';
import { doc, writeBatch, serverTimestamp, getDoc, collection, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const companySchema = z.object({
  companyName: z.string().min(3, 'El nombre de la empresa debe tener al menos 3 caracteres.'),
});

const warehouseSchema = z.object({
  warehouseName: z.string().min(3, 'El nombre del almacén es requerido.'),
  warehouseLocation: z.string().optional(),
});

const productSchema = z.object({
  productName: z.string().min(3, 'El nombre del producto es requerido.'),
  productSku: z.string().min(1, 'El SKU es requerido.'),
  initialStock: z.coerce.number().int().nonnegative('El stock no puede ser negativo.'),
});

const stepSchemas = [companySchema, warehouseSchema, productSchema];

type FormValues = z.infer<typeof companySchema> & z.infer<typeof warehouseSchema> & z.infer<typeof productSchema>;

const StepContent = ({ step }: { step: number }) => {
  const { register, formState: { errors } } = useFormContext();
  
  if (step === 0) {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Nombre de tu Empresa</label>
          <Input {...register('companyName')} id="companyName" placeholder="Ej: Flux Logistics S.A." />
          {errors.companyName && <p className="mt-2 text-sm text-red-600">{`${errors.companyName.message}`}</p>}
        </div>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="warehouseName" className="block text-sm font-medium text-gray-700 mb-1">Nombre de tu Almacén Principal</label>
          <Input {...register('warehouseName')} id="warehouseName" placeholder="Ej: Bodega Central" />
          {errors.warehouseName && <p className="mt-2 text-sm text-red-600">{`${errors.warehouseName.message}`}</p>}
        </div>
        <div>
          <label htmlFor="warehouseLocation" className="block text-sm font-medium text-gray-700 mb-1">Ubicación (Opcional)</label>
          <Input {...register('warehouseLocation')} id="warehouseLocation" placeholder="Ej: Santiago, Chile" />
        </div>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">Nombre de tu primer producto</label>
          <Input {...register('productName')} id="productName" placeholder="Ej: Zapatillas Deportivas" />
          {errors.productName && <p className="mt-2 text-sm text-red-600">{`${errors.productName.message}`}</p>}
        </div>
        <div>
          <label htmlFor="productSku" className="block text-sm font-medium text-gray-700 mb-1">SKU (Identificador único)</label>
          <Input {...register('productSku')} id="productSku" placeholder="Ej: ZAP-DEP-42" />
          {errors.productSku && <p className="mt-2 text-sm text-red-600">{`${errors.productSku.message}`}</p>}
        </div>
        <div>
          <label htmlFor="initialStock" className="block text-sm font-medium text-gray-700 mb-1">Cantidad Inicial</label>
          <Input {...register('initialStock')} id="initialStock" type="number" placeholder="100" />
          {errors.initialStock && <p className="mt-2 text-sm text-red-600">{`${errors.initialStock.message}`}</p>}
        </div>
      </div>
    );
  }
  if (step === 3) {
    const { getValues } = useFormContext();
    const values = getValues();
    return (
      <div>
        <h3 className="text-lg font-medium">Resumen de Configuración</h3>
        <p className="mt-1 text-sm text-muted-foreground">Verifica los datos antes de lanzar tu nuevo WMS.</p>
        <ul className="mt-4 space-y-2 text-sm p-4 bg-muted/50 rounded-lg border">
          <li><strong className="font-medium text-foreground">Empresa:</strong> {values.companyName}</li>
          <li><strong className="font-medium text-foreground">Almacén:</strong> {values.warehouseName} ({values.warehouseLocation || 'Sin ubicación'})</li>
          <li><strong className="font-medium text-foreground">Producto:</strong> {values.productName} (SKU: {values.productSku})</li>
          <li><strong className="font-medium text-foreground">Stock Inicial:</strong> {values.initialStock || 0} unidades</li>
        </ul>
      </div>
    );
  }
  return null;
};

const stepTitles = [
  'Configura tu operación en minutos',
  'Define tu primer almacén',
  'Agrega tu primer producto',
  '¡Todo listo para empezar!'
];

const stepDescriptions = [
  'Esto nos permite adaptar el sistema a tu negocio.',
  'Desde aquí se controla el stock y los despachos.',
  'El stock inicial se calculará automáticamente.',
  'Revisa la configuración. Todo estará listo para que explores la plataforma.'
];

const stepCtas = [
  'Continuar',
  'Crear almacén',
  'Crear producto',
  'Finalizar e ir al Dashboard',
];

export default function FirstRunPage() {
  const router = useRouter();
  const { user, appUser, companyId, loading: authLoading } = useAuth();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [step, setStep] = useState(0);
  const [isFinishing, startFinishTransition] = useTransition();

  const methods = useForm<FormValues>({
    resolver: async (data, context, options) => {
        const currentSchema = stepSchemas[step] || companySchema;
        return zodResolver(currentSchema)(data, context, options);
    },
    shouldFocusError: true,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else if (localStorage.getItem('onboardingComplete') === 'true') {
        router.replace('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const handleNext = async () => {
    const isValid = await methods.trigger();
    if (isValid) {
      setStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 0));
  };
  
  const handleSkip = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('onboardingComplete', 'true');
    }
    toast({
        title: 'Configuración omitida',
        description: 'Puedes configurar tu empresa más tarde desde los ajustes.',
    });
    router.push('/dashboard');
  };

  const handleFinish = async () => {
    if (!firestore || !appUser || !companyId) {
        toast({ variant: 'destructive', title: 'Error', description: 'La conexión con la base de datos no está disponible.' });
        return;
    }

    startFinishTransition(async () => {
      const values = methods.getValues();

      try {
          const batch = writeBatch(firestore);

          // 1. Update company if it's the default one
          const companyRef = doc(firestore, 'companies', companyId);
          const companySnap = await getDoc(companyRef);
          if (companySnap.exists() && companySnap.data().name.includes('Default')) {
              batch.update(companyRef, { name: values.companyName });
          }

          // 2. Create Warehouse
          const warehouseId = values.warehouseName.toLowerCase().replace(/\s+/g, '_');
          const warehouseRef = doc(firestore, 'warehouses', warehouseId);
          batch.set(warehouseRef, { 
              name: values.warehouseName, 
              location: values.warehouseLocation || '',
              companyId: companyId,
              isActive: true,
              createdAt: serverTimestamp(),
          });
          
          // 3. Create Product
          const productRef = doc(firestore, 'products', values.productSku);
          batch.set(productRef, {
              name: values.productName,
              sku: values.productSku,
              companyId: companyId,
              createdAt: serverTimestamp(),
              description: '',
              price: 0
          });
          
          // 4. Create initial inventory if stock > 0
          if (values.initialStock > 0) {
              const balanceId = `${companyId}_${warehouseId}_default_${values.productSku.toLowerCase()}`;
              const balanceRef = doc(firestore, 'inventory_balances', balanceId);
              batch.set(balanceRef, {
                  companyId,
                  warehouseId,
                  clientId: 'default', // Using a default client for onboarding
                  sku: values.productSku,
                  qty: values.initialStock,
                  reservedQty: 0,
                  updatedAt: serverTimestamp(),
              });

              // Create ledger entry
              const ledgerRef = doc(collection(firestore, 'inventory_ledger'));
              batch.set(ledgerRef, {
                  companyId,
                  warehouseId,
                  clientId: 'default',
                  sku: values.productSku,
                  deltaQty: values.initialStock,
                  type: 'inbound',
                  refType: 'manual',
                  note: 'Stock inicial del onboarding',
                  createdAt: serverTimestamp(),
                  createdBy: appUser.uid
              });
          }
          
          // 5. Update user profile to link to the new warehouse
          const userRef = doc(firestore, 'users', appUser.uid);
          batch.update(userRef, { warehouseIds: [warehouseId] });

          // 6. Set initial KPI snapshot
          const kpiRef = doc(firestore, 'kpi_snapshots', companyId);
          batch.set(kpiRef, {
              criticalStockItems: values.initialStock > 0 ? 0 : 1,
              ordersToday: 0,
              ordersInProgress: 0,
              ordersDelayed: 0,
              updatedAt: serverTimestamp()
          }, { merge: true });

          // 7. Create Onboarding Checklist
          const checklistRef = doc(firestore, 'onboarding_checklists', companyId);
          batch.set(checklistRef, {
            companyId,
            steps: {
                createProduct: false,
                createOrder: false,
                moveInventory: false,
                viewDashboard: true,
            },
            completed: false,
            updatedAt: serverTimestamp(),
          });


          await batch.commit();

          if (typeof window !== 'undefined') {
              localStorage.setItem('onboardingComplete', 'true');
          }
          
          toast({
              title: '¡Configuración completada!',
              description: 'Tu espacio de trabajo está listo. Bienvenido a FLUX.',
          });
          router.push('/dashboard');
      } catch (error: any) {
          console.error("Error finishing onboarding:", error);
          toast({
              variant: 'destructive',
              title: 'Error al finalizar',
              description: error.message || 'No se pudo guardar la configuración.',
          });
      }
    });
  };

  if (authLoading || !user) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const isFinalStep = step === 3;
  const progress = ((step + 1) / stepTitles.length) * 100;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-black p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <Progress value={progress} className="mb-4 h-2" />
          <CardTitle className="text-xl">{stepTitles[step]}</CardTitle>
          <CardDescription>{stepDescriptions[step]}</CardDescription>
        </CardHeader>
        <FormProvider {...methods}>
          <form onSubmit={(e) => e.preventDefault()}>
            <CardContent className="min-h-[260px]">
              <StepContent step={step} />
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={handleSkip} disabled={isFinishing}>
                  Omitir por ahora
                </Button>
                <div className="flex gap-2">
                  {step > 0 && <Button variant="outline" onClick={handleBack} disabled={isFinishing}>Atrás</Button>}
                  {isFinalStep ? (
                    <Button onClick={handleFinish} disabled={isFinishing} size="lg">
                        {isFinishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {stepCtas[step]}
                    </Button>
                  ) : (
                    <Button onClick={handleNext}>{stepCtas[step]}</Button>
                  )}
                </div>
            </CardFooter>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}
