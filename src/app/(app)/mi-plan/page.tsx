'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MiPlanPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/mi-plan/hoy');
  }, [router]);

  return null;
}
