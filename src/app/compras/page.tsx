import { listarCompras, listarClientes, listarPrendas } from "@/lib/db/repo";
import { crearCompra } from "@/lib/actions";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader, PageHeader, Button, Field, SelectField, TextArea } from "@/components/ui";

const categorias = [
  "Joyería", "Electrónica", "Herramientas", "Relojes",
  "Vehículos", "Instrumentos", "Electrodomésticos", "Otro",
].map((c) => ({ value: c, label: c }));

export default async function ComprasPage() {
  const [compras, clientes, prendas] = await Promise.all([
    listarCompras(),
    listarClientes(),
    listarPrendas(),
  ]);

  const total = compras.reduce((s, c) => s + c.monto, 0);
  const clienteDe = (id: string | null) =>
    id ? clientes.find((c) => c.id === id) : null;
  const prendaDe = (id: string) => prendas.find((p) => p.id === id);

  const opcionesCliente = [
    { value: "", label: "— Sin registrar (anónimo) —" },
    ...clientes.map((c) => ({ value: c.id, label: `${c.nombre} ${c.apellidoPaterno}` })),
  ];

  return (
    <div>
      <PageHeader
        title="Compra directa"
        subtitle={`${compras.length} compras · ${formatMXN(total)} invertido`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulario */}
        <Card className="lg:col-span-1">
          <CardHeader title="Nueva compra" subtitle="Adquirir artículo (pasa a inventario en venta)" />
          <form action={crearCompra} className="space-y-4 p-5">
            <SelectField label="Departamento" name="categoria" options={categorias} defaultValue="Joyería" required />
            <Field label="Descripción" name="descripcion" required />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Marca" name="marca" />
              <Field label="Modelo" name="modelo" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Color" name="color" />
              <Field label="Serie" name="serie" />
            </div>
            <Field label="Monto de compra (MXN)" name="monto" type="number" step="0.01" required />
            <SelectField label="Vendedor (cliente)" name="clienteId" options={opcionesCliente} />
            <TextArea label="Notas" name="notas" />
            <Button type="submit" className="w-full">Registrar compra</Button>
          </form>
        </Card>

        {/* Historial */}
        <Card className="lg:col-span-2">
          <CardHeader title="Compras realizadas" />
          {compras.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Aún no hay compras registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Folio</th>
                    <th className="px-5 py-3 font-medium">Artículo</th>
                    <th className="px-5 py-3 font-medium">Vendedor</th>
                    <th className="px-5 py-3 font-medium">Monto</th>
                    <th className="px-5 py-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {compras.map((c) => {
                    const cli = clienteDe(c.clienteId);
                    return (
                      <tr key={c.id} className="hover:bg-surface-2">
                        <td className="px-5 py-3 font-mono text-xs text-muted">{c.folio}</td>
                        <td className="px-5 py-3 text-foreground">{prendaDe(c.prendaId)?.descripcion ?? "—"}</td>
                        <td className="px-5 py-3 text-muted">{cli ? `${cli.nombre} ${cli.apellidoPaterno}` : "Anónimo"}</td>
                        <td className="px-5 py-3 font-medium text-danger">−{formatMXN(c.monto)}</td>
                        <td className="px-5 py-3 text-muted">{formatFecha(c.fecha)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
