import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function VerificacionExitosaPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <CardTitle>Cuenta verificada</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión.
        </p>
        <Button asChild className="w-full">
          <Link href="/login">Iniciar sesión</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
