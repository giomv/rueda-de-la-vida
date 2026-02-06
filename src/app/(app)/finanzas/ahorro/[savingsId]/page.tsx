'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SavingsForm } from '@/components/finances';
import { getSavingsMovement } from '@/lib/actions/savings-actions';
import type { SavingsMovement } from '@/lib/types/dashboard';

export default function EditSavingsPage({
  params,
}: {
  params: Promise<{ savingsId: string }>;
}) {
  const { savingsId } = use(params);
  const router = useRouter();
  const [savings, setSavings] = useState<SavingsMovement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSavings() {
      try {
        const data = await getSavingsMovement(savingsId);
        setSavings(data);
      } catch (error) {
        console.error('Error loading savings:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSavings();
  }, [savingsId]);

  const handleSuccess = () => {
    router.push('/finanzas/gastos');
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!savings) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Ahorro no encontrado</p>
          <Button onClick={() => router.push('/finanzas/gastos')}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Editar ahorro</h1>
      </div>

      {/* Edit form */}
      <SavingsForm savings={savings} onSuccess={handleSuccess} />
    </div>
  );
}
