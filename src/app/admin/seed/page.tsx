'use client';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { seedDatabase } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';
import { Loader2, Database } from 'lucide-react';

export default function SeedPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleSeed = () => {
    startTransition(async () => {
      const result = await seedDatabase();
      if (result.success) {
        toast({
          title: 'Success',
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
          <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
        </div>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Seed Database</CardTitle>
            <CardDescription>Initialize the application with starting data. This action should only be performed once.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Clicking this button will populate the Firestore database with initial collections and documents required for the application to function correctly. This includes creating a default company, admin user, and other necessary records.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSeed} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              {isPending ? 'Seeding...' : 'Seed Database'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}
