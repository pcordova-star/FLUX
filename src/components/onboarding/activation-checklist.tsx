'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useFirebase } from '@/context/firebase-provider';
import { doc, updateDoc } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Loader2, Rocket, X } from 'lucide-react';
import type { OnboardingChecklist } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const checklistItems = [
    { id: 'createProduct', label: 'Crea tu primer producto real', href: '/products' },
    { id: 'moveInventory', label: 'Registra una entrada de stock', href: '/inventory' },
    { id: 'createOrder', label: 'Crea tu primera orden', href: '/orders' },
    { id: 'viewDashboard', label: 'Revisa tu dashboard actualizado', href: '/dashboard' },
];

function ChecklistItem({ label, completed, href }: { label: string, completed: boolean, href: string }) {
  const Icon = completed ? CheckCircle2 : Circle;
  return (
    <Link href={href} className="flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-muted">
      <Icon className={cn('h-5 w-5', completed ? 'text-green-500' : 'text-muted-foreground')} />
      <span className={cn('text-sm', completed && 'line-through text-muted-foreground')}>
        {label}
      </span>
    </Link>
  );
}

export function ActivationChecklist() {
  const { companyId } = useAuth();
  const { firestore } = useFirebase();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const storedVisibility = localStorage.getItem(`checklistVisible_${companyId}`);
    if (storedVisibility === null) { // Only show by default on first visit
      setIsVisible(true);
    } else {
      setIsVisible(storedVisibility === 'true');
    }
  }, [companyId]);

  const checklistRef = companyId ? doc(firestore, 'onboarding_checklists', companyId) : null;
  const [checklistData, loading, error] = useDocumentData<OnboardingChecklist>(checklistRef);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`checklistVisible_${companyId}`, 'false');
  };

  useEffect(() => {
    if (checklistData?.completed) {
      // If completed, we can show a toast or a one-time celebration message
      // For now, just dismiss it permanently
      handleDismiss();
    }
  }, [checklistData?.completed]);
  
  if (!isVisible || !companyId || loading || error || !checklistData || checklistData.completed) {
    return null;
  }
  
  const completedSteps = Object.values(checklistData.steps).filter(Boolean).length;
  const totalSteps = checklistItems.length;
  const progress = (completedSteps / totalSteps) * 100;


  if (completedSteps === totalSteps && !checklistData.completed) {
     if(checklistRef) {
        updateDoc(checklistRef, { completed: true });
        // Optionally show a toast message for completion
     }
     return null;
  }
  
  if (progress === 100) {
      return (
        <Card className="mb-6 relative bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
             <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={handleDismiss}>
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
            </Button>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600"/>
                    <CardTitle className="text-green-900 dark:text-green-100">¡Tu operación ya está activa!</CardTitle>
                </div>
                 <CardDescription className="text-green-700 dark:text-green-300">Has completado los primeros pasos. Ahora el sistema trabaja para ti.</CardDescription>
            </CardHeader>
        </Card>
      )
  }


  return (
    <Card className="mb-6 relative">
      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={handleDismiss}>
        <X className="h-4 w-4" />
        <span className="sr-only">Cerrar</span>
      </Button>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary"/>
            <CardTitle>Primeros pasos para activar tu cuenta</CardTitle>
        </div>
        <CardDescription>Sigue esta guía para realizar tus primeras operaciones y ver FLUX en acción.</CardDescription>
        <div className="flex items-center gap-4 pt-2">
            <Progress value={progress} className="w-full" />
            <span className="text-sm font-medium text-muted-foreground">{completedSteps} / {totalSteps} completado</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {checklistItems.map(item => (
                <ChecklistItem
                    key={item.id}
                    label={item.label}
                    completed={checklistData.steps[item.id as keyof typeof checklistData.steps] || false}
                    href={item.href}
                />
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
