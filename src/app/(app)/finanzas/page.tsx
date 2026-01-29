'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FinanzasPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/finanzas/gastos');
  }, [router]);

  return null;
}
