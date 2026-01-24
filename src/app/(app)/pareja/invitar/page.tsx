'use client';

import { InvitePartner } from '@/components/partner/InvitePartner';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InvitarPage() {
  const router = useRouter();

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/pareja')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Invitar pareja</h1>
      </div>

      <InvitePartner />
    </div>
  );
}
