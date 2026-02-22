export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Panel de Administracion</h1>
        <p className="text-muted-foreground">Gestiona usuarios e invitaciones</p>
      </div>
      {children}
    </div>
  );
}
