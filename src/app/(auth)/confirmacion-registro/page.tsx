import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';

export default function ConfirmacionRegistroPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Mail className="h-12 w-12 text-primary" />
        </div>
        <CardTitle>Revisa tu correo</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground">
          Te hemos enviado un correo de verificación. Haz clic en el enlace del correo para activar tu cuenta.
        </p>
      </CardContent>
    </Card>
  );
}
