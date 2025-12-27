'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/auth-context';
import { useFirebase } from '@/context/firebase-provider';
import { doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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
  initialStock: z.coerce.number().int().nonnegative('El stock inicial no puede ser negativo.'),
});

const stepSchemas = [companySchema, warehouseSchema, productSchema];

type FormValues = z.infer<typeof companySchema> & z.infer<typeof warehouseSchema> & z.infer<typeof productSchema>;

const StepContent = ({ step }: { step: number }) => {
  const { register, formState: { errors } } = useFormContext();
  
  if (step === 0) {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
          <input {...register('companyName')} id="companyName" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
          {errors.companyName && <p className="mt-2 text-sm text-red-600">{`${errors.companyName.message}`}</p>}
        </div>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="warehouseName" className="block text-sm font-medium text-gray-700">Nombre del Almacén</label>
          <input {...register('warehouseName')} id="warehouseName" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
          {errors.warehouseName && <p className="mt-2 text-sm text-red-600">{`${errors.warehouseName.message}`}</p>}
        </div>
        <div>
          <label htmlFor="warehouseLocation" className="block text-sm font-medium text-gray-700">Ubicación (Opcional)</label>
          <input {...register('warehouseLocation')} id="warehouseLocation" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
        </div>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
          <input {...register('productName')} id="productName" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
          {errors.productName && <p className="mt-2 text-sm text-red-600">{`${errors.productName.message}`}</p>}
        </div>
        <div>
          <label htmlFor="productSku" className="block text-sm font-medium text-gray-700">SKU</label>
          <input {...register('productSku')} id="productSku" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
          {errors.productSku && <p className="mt-2 text-sm text-red-600">{`${errors.productSku.message}`}</p>}
        </div>
        <div>
          <label htmlFor="initialStock" className="block text-sm font-medium text-gray-700">Stock Inicial</label>
          <input {...register('initialStock')} id="initialStock" type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
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
        <h3 className="text-lg font-medium">Resumen</h3>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li><strong>Empresa:</strong> {values.companyName}</li>
          <li><strong>Almacén:</strong> {values.warehouseName} ({values.warehouseLocation || 'Sin ubicación'})</li>
          <li><strong>Producto:</strong> {values.productName} ({values.productSku})</li>
          <li><strong>Stock Inicial:</strong> {values.initialStock} unidades</li>
        </ul>
        <p className="mt-4 text-sm">Al finalizar, estos datos se crearán en tu cuenta para que puedas empezar a operar.</p>
      </div>
    );
  }
  return null;
};

const stepTitles = [
  'Configura tu Empresa',
  'Crea tu primer Almacén',
  'Agrega un Producto de demostración',
  '¡Todo listo para empezar!'
];

const stepDescriptions = [
  'Danos el nombre de tu empresa para personalizar tu espacio de trabajo.',
  'Define el primer almacén desde donde gestionarás tu inventario.',
  'Añade un producto inicial para poder realizar las primeras operaciones.',
  'Revisa la configuración. Todo estará listo para que explores la plataforma.'
];

export default function FirstRunPage() {
  const router = useRouter();
  const { user, appUser, companyId, loading: authLoading } = useAuth();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  // Zod schema for validation of all steps at once
  const fullSchema = companySchema.merge(warehouseSchema).merge(productSchema);

  const methods = useForm<FormValues>({
    resolver: async (data, context, options) => {
        const currentSchema = stepSchemas[step] || companySchema;
        return zodResolver(currentSchema)(data, context, options);
    },
    shouldFocusError: false,
  });

  useEffect(() => {
    // Redirect if user is not logged in or onboarding is complete
    if (typeof window !== 'undefined') {
      const onboardingComplete = localStorage.getItem('onboardingComplete');
      if (onboardingComplete === 'true') {
        router.replace('/dashboard');
        return;
      }
    }
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const handleNext = async () => {
    const isValid = await methods.trigger();
    if (isValid) {
      setStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 0));
  };
  
  const handleSkip = () => {
    setIsSkipping(true);
    if (typeof window !== 'undefined') {
        localStorage.setItem('onboardingComplete', 'true');
    }
    toast({
        title: 'Configuración omitida',
        description: 'Puedes configurar tu empresa más tarde.',
    });
    router.push('/dashboard');
  };

  const handleFinish = async () => {
    if (!firestore || !appUser || !companyId) {
        toast({ variant: 'destructive', title: 'Error', description: 'La conexión con la base de datos no está disponible.' });
        return;
    }
    setIsLoading(true);

    const values = methods.getValues();

    try {
        const batch = writeBatch(firestore);

        // 1. Update company
        const companyRef = doc(firestore, 'companies', companyId);
        batch.update(companyRef, { name: values.companyName });

        // 2. Create Warehouse
        const warehouseId = values.warehouseName.toLowerCase().replace(/\s+/g, '_');
        const warehouseRef = doc(firestore, 'warehouses', warehouseId);
        batch.set(warehouseRef, { 
            name: values.warehouseName, 
            location: values.warehouseLocation,
            companyId: companyId,
            createdAt: new Date(),
        });
        
        // 3. Create Product
        const productRef = doc(firestore, 'products', values.productSku);
        batch.set(productRef, {
            name: values.productName,
            sku: values.productSku,
            companyId: companyId,
            createdAt: new Date(),
        });
        
        // 4. Create initial inventory if stock > 0
        if (values.initialStock > 0) {
            const balanceId = `${companyId}_${warehouseId}_${appUser.clientId || 'default'}_${values.productSku.toLowerCase()}`;
            const balanceRef = doc(firestore, 'inventory_balances', balanceId);
            batch.set(balanceRef, {
                companyId,
                warehouseId,
                clientId: appUser.clientId || 'default',
                sku: values.productSku,
                qty: values.initialStock,
                reservedQty: 0,
                updatedAt: new Date(),
            });
        }

        await batch.commit();

        if (typeof window !== 'undefined') {
            localStorage.setItem('onboardingComplete', 'true');
        }
        
        toast({
            title: '¡Configuración completada!',
            description: 'Tu espacio de trabajo está listo.',
        });
        router.push('/dashboard');
    } catch (error: any) {
        console.error("Error finishing onboarding:", error);
        toast({
            variant: 'destructive',
            title: 'Error al finalizar',
            description: error.message || 'No se pudo guardar la configuración.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const isFinalStep = step === 3;
  const progress = ((step) / (stepTitles.length -1)) * 100;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <Progress value={progress} className="mb-4 h-2" />
          <CardTitle>{stepTitles[step]}</CardTitle>
          <CardDescription>{stepDescriptions[step]}</CardDescription>
        </CardHeader>
        <FormProvider {...methods}>
          <CardContent>
            <StepContent step={step} />
          </CardContent>
        </FormProvider>
        <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={handleSkip} disabled={isLoading || isSkipping}>
              {isSkipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Omitir por ahora
            </Button>
            <div className="flex gap-2">
              {step > 0 && <Button variant="outline" onClick={handleBack} disabled={isLoading}>Atrás</Button>}
              {isFinalStep ? (
                <Button onClick={handleFinish} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Finalizar y ir al Dashboard
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={isLoading}>Siguiente</Button>
              )}
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
