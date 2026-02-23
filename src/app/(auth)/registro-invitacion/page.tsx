'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { validateInvitation, registerWithInvitation } from '@/lib/actions/admin-actions';

export default function RegistroInvitacionPage() {
  return (
    <Suspense fallback={
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Cargando...
        </CardContent>
      </Card>
    }>
      <RegistroInvitacionContent />
    </Suspense>
  );
}

function RegistroInvitacionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [validating, setValidating] = useState(true);
  const [tokenError, setTokenError] = useState('');
  const [email, setEmail] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function validate() {
      if (!token) {
        setTokenError('Token de invitación no proporcionado.');
        setValidating(false);
        return;
      }

      const result = await validateInvitation(token);
      if (result.error) {
        setTokenError(result.error);
      } else if (result.email) {
        setEmail(result.email);
      }
      setValidating(false);
    }
    validate();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!termsAccepted) {
      setError('Debes aceptar los términos y condiciones.');
      return;
    }

    setLoading(true);

    const result = await registerWithInvitation({
      token,
      email,
      password,
      firstName,
      lastName,
      documentType,
      documentNumber,
      birthDate,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  if (validating) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Validando invitación...
        </CardContent>
      </Card>
    );
  }

  if (tokenError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitación inválida</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{tokenError}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear tu cuenta</CardTitle>
        <CardDescription>
          Completa tus datos para registrarte en VIA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de documento</Label>
              <Select value={documentType} onValueChange={setDocumentType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DNI">DNI</SelectItem>
                  <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentNumber">Número de documento</Label>
              <Input
                id="documentNumber"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Fecha de nacimiento</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              className="mt-0.5"
            />
            <span className="text-sm font-normal leading-snug">
              Acepto los{' '}
              <button type="button" className="inline underline text-primary hover:text-primary/80" onClick={() => setShowTerms(true)}>términos y condiciones</button>
              {' '}y las{' '}
              <button type="button" className="inline underline text-primary hover:text-primary/80" onClick={() => setShowPrivacy(true)}>políticas de privacidad</button>
            </span>
          </div>

          <Dialog open={showTerms} onOpenChange={setShowTerms}>
            <DialogContent className="max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>TÉRMINOS Y CONDICIONES DEL SERVICIO</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm text-muted-foreground overflow-y-auto flex-1 min-h-0">
                <p className="italic">VIA – Ecosistema Digital de Arquitectura Personal<br />Última actualización: 23/02/2025</p>

                <h3 className="font-semibold text-foreground">1. Identificación del titular</h3>
                <p>El presente servicio es ofrecido por la persona natural Lucía Flores Saavedra, en calidad de servicios independientes. En adelante, &quot;VIA&quot;.</p>

                <h3 className="font-semibold text-foreground">2. Naturaleza del servicio</h3>
                <p>VIA es una plataforma digital que permite a los usuarios:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Evaluar dominios de vida</li>
                  <li>Definir metas y acciones</li>
                  <li>Organizar planificación anual</li>
                  <li>Registrar información financiera vinculada a objetivos</li>
                  <li>Registrar sesiones personales</li>
                  <li>Compartir bitácoras con otros usuarios</li>
                  <li>Vincularse con especialistas dentro del ecosistema</li>
                </ul>
                <p>VIA no constituye:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Servicio médico</li>
                  <li>Servicio psicológico</li>
                  <li>Asesoría legal</li>
                  <li>Asesoría financiera formal</li>
                  <li>Servicio clínico</li>
                </ul>
                <p>VIA es una herramienta de organización, planificación y acompañamiento estructurado.</p>

                <h3 className="font-semibold text-foreground">3. Modalidad de acceso</h3>
                <h4 className="font-medium text-foreground">Usuarios</h4>
                <p>El acceso a VIA se otorga mediante:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Pago único por licencia personal, no transferible.</li>
                  <li>El acceso es individual e intransferible.</li>
                </ul>
                <h4 className="font-medium text-foreground">VIA – Especialistas</h4>
                <p>El acceso profesional se otorga mediante:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Suscripción mensual.</li>
                  <li>Requiere que los usuarios vinculados tengan acceso activo a VIA.</li>
                </ul>

                <h3 className="font-semibold text-foreground">3. Sobre las metodologías utilizadas</h3>
                <h4 className="font-medium text-foreground">3.1 Rueda de la Vida</h4>
                <p>La funcionalidad &quot;Rueda de la Vida&quot; implementada en VIA constituye una adaptación digital de una herramienta conceptual ampliamente utilizada en procesos de coaching y desarrollo personal.</p>
                <p>VIA no reclama autoría sobre el concepto original de la &quot;Rueda de la Vida&quot;. La implementación tecnológica, estructura de integración con metas y acciones, y diseño del sistema dentro del ecosistema VIA son propiedad intelectual exclusiva de VIA.</p>
                <h4 className="font-medium text-foreground">3.2 Plan de Vida</h4>
                <p>La funcionalidad &quot;Plan de Vida&quot; incorpora principios inspirados en metodologías de diseño de vida como el modelo conocido como &quot;Odyssey Plan&quot; (Life Design).</p>
                <p>VIA no reclama titularidad sobre dichos marcos conceptuales. La estructura digital, integración con dominios, metas, acciones y sistema financiero dentro de la plataforma constituye una adaptación original desarrollada por VIA.</p>

                <h3 className="font-semibold text-foreground">4. Propiedad intelectual</h3>
                <p>La integración sistémica de:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Diagnóstico por dominios</li>
                  <li>Planificación estratégica anual</li>
                  <li>Sistema de acciones vinculadas</li>
                  <li>Integración financiera con propósito</li>
                  <li>Bitácora estructurada</li>
                  <li>Ecosistema usuario–especialista</li>
                </ul>
                <p>es propiedad intelectual de VIA. Queda prohibido:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Copiar la metodología integrada.</li>
                  <li>Reproducir la estructura del sistema.</li>
                  <li>Comercializar versiones derivadas sin autorización.</li>
                </ul>

                <h3 className="font-semibold text-foreground">5. Modalidad de acceso</h3>
                <h4 className="font-medium text-foreground">Modalidad de pago único</h4>
                <p>El acceso a la plataforma VIA bajo la modalidad de usuario se otorga mediante un pago único por licencia de uso personal, individual e intransferible.</p>
                <p>Este pago no constituye una suscripción periódica ni garantiza actualizaciones perpetuas, sino el derecho de acceso a la plataforma mientras esta se encuentre disponible y operativa.</p>
                <h4 className="font-medium text-foreground">Vigencia del acceso</h4>
                <p>El usuario tendrá acceso a la plataforma por tiempo indefinido mientras:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>VIA mantenga el servicio activo; y</li>
                  <li>el usuario cumpla con los presentes Términos y Condiciones.</li>
                </ul>
                <p>VIA podrá modificar, actualizar, suspender o descontinuar total o parcialmente el servicio por razones técnicas, comerciales o estratégicas, sin que ello genere obligación de indemnización.</p>
                <h4 className="font-medium text-foreground">Política de no reembolso</h4>
                <p>Debido a la naturaleza digital del servicio y a que el acceso se habilita inmediatamente tras la confirmación del pago:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>El pago realizado es no reembolsable, salvo disposición legal expresa en contrario.</li>
                  <li>No se realizarán devoluciones por uso parcial, falta de uso, cambio de opinión o desconocimiento de funcionalidades.</li>
                </ul>
                <p>En caso de falla técnica atribuible exclusivamente a VIA que impida el acceso inicial al servicio y no pueda ser solucionada dentro de un plazo razonable, el usuario podrá solicitar evaluación del caso conforme a la normativa vigente.</p>
                <h4 className="font-medium text-foreground">Derecho de reclamo</h4>
                <p>Lo anterior no limita el derecho del usuario a presentar reclamos conforme a la legislación peruana de protección al consumidor.</p>
                <h4 className="font-medium text-foreground">VIA – Especialistas</h4>
                <p>El acceso profesional se otorga mediante suscripción mensual. Para vincular un usuario, este debe contar con acceso activo a VIA.</p>

                <h3 className="font-semibold text-foreground">6. Vinculación con especialistas</h3>
                <p>El vínculo especialista–usuario:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Requiere consentimiento expreso del usuario.</li>
                  <li>Puede revocarse en cualquier momento.</li>
                  <li>Permite compartir únicamente el bloque de recomendaciones.</li>
                  <li>No otorga acceso a notas privadas del especialista.</li>
                </ul>
                <p>VIA no supervisa el contenido clínico o profesional publicado por especialistas.</p>

                <h3 className="font-semibold text-foreground">7. Bitácora compartida</h3>
                <p>Cuando un usuario comparte una sesión:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Ambos usuarios visualizan el contenido según permisos establecidos.</li>
                  <li>El creador conserva titularidad.</li>
                  <li>La eliminación por el creador elimina el contenido para todos los miembros del espacio.</li>
                </ul>

                <h3 className="font-semibold text-foreground">8. Limitación de responsabilidad</h3>
                <p>El usuario reconoce que:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>VIA es una herramienta de organización.</li>
                  <li>No garantiza resultados específicos.</li>
                  <li>No sustituye tratamiento médico, psicológico o asesoría profesional.</li>
                </ul>
                <p>Las decisiones adoptadas por el usuario son de su exclusiva responsabilidad.</p>

                <h3 className="font-semibold text-foreground">9. Disponibilidad del servicio</h3>
                <p>VIA procura mantener disponibilidad continua, sin embargo pueden existir interrupciones por mantenimiento o causas técnicas.</p>

                <h3 className="font-semibold text-foreground">10. Jurisdicción</h3>
                <p>El presente contrato se rige por las leyes de la República del Perú. Cualquier controversia será resuelta ante los tribunales competentes de Lima, Perú.</p>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
            <DialogContent className="max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>POLÍTICA DE PRIVACIDAD</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm text-muted-foreground overflow-y-auto flex-1 min-h-0">
                <p className="italic">Conforme a la Ley N° 29733 y su Reglamento</p>

                <h3 className="font-semibold text-foreground">1. Marco normativo</h3>
                <p>La presente política se rige por:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Ley N° 29733 – Ley de Protección de Datos Personales.</li>
                  <li>D.S. 003-2013-JUS – Reglamento.</li>
                  <li>Normativa complementaria emitida por la Autoridad Nacional de Protección de Datos Personales.</li>
                </ul>

                <h3 className="font-semibold text-foreground">2. Datos recopilados</h3>
                <p>VIA podrá recopilar:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Datos de identificación (nombre, correo).</li>
                  <li>Información ingresada voluntariamente en ruedas, metas, finanzas y bitácora.</li>
                  <li>Información de especialistas vinculados.</li>
                  <li>Información de sesiones compartidas.</li>
                </ul>
                <p>No se requiere información médica obligatoria para el uso general de la plataforma.</p>

                <h3 className="font-semibold text-foreground">3. Finalidades</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Gestión de cuentas.</li>
                  <li>Funcionamiento del ecosistema.</li>
                  <li>Vinculación con especialistas.</li>
                  <li>Mejora del servicio.</li>
                  <li>Cumplimiento contractual.</li>
                </ul>

                <h3 className="font-semibold text-foreground">4. Consentimiento</h3>
                <p>El tratamiento de datos se realiza con consentimiento libre, previo, expreso e informado.</p>
                <p>El usuario puede revocar el consentimiento en cualquier momento.</p>

                <h3 className="font-semibold text-foreground">5. Confidencialidad</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Las notas privadas de especialistas no son visibles al usuario.</li>
                  <li>Solo las recomendaciones publicadas se muestran en la cuenta del usuario.</li>
                  <li>Se implementan medidas técnicas razonables de seguridad.</li>
                </ul>

                <h3 className="font-semibold text-foreground">6. Derechos ARCO</h3>
                <p>El usuario puede ejercer derechos de:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Acceso</li>
                  <li>Rectificación</li>
                  <li>Cancelación</li>
                  <li>Oposición</li>
                </ul>

                <h3 className="font-semibold text-foreground">7. Conservación de datos</h3>
                <p>Los datos se conservarán mientras exista relación contractual activa o hasta que el usuario solicite eliminación, salvo obligaciones legales.</p>

                <h3 className="font-semibold text-foreground">8. Transferencias internacionales</h3>
                <p>Si se utilizan servicios de almacenamiento en la nube fuera del Perú, se garantizará el cumplimiento de estándares adecuados de protección de datos.</p>
              </div>
            </DialogContent>
          </Dialog>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
