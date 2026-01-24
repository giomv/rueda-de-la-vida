'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface SharedWheelProps {
  partnerName: string;
}

export function SharedWheel({ partnerName }: SharedWheelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5" />
          Rueda compartida con {partnerName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Creen una rueda juntos definiendo dominios en común y puntuando
          por consenso. Ideal para evaluar la relación como equipo.
        </p>
      </CardContent>
    </Card>
  );
}
