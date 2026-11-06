import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerCliente } from "@/lib/db/repo";
import { actualizarCliente } from "@/lib/actions";
import { Card, CardHeader, Button, Field, SelectField, TextArea, PageHeader, VolverLink } from "@/components/ui";
import { formatearTelefonoVista } from "@/lib/telefono";

export const metadata = { title: "Editar cliente" };

const tiposId = [
  { value: "INE", label: "INE / IFE" },
  { value: "Pasaporte", label: "Pasaporte" },
  { value: "Licencia", label: "Licencia de conducir" },
  { value: "Cédula", label: "Cédula profesional" },
  { value: "Otro", label: "Otro" },
];

export default async function EditarCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await obtenerCliente(id);
  if (!c) notFound();

  return (
    <div>
      <VolverLink href={`/clientes/${c.id}`} label="Ficha del cliente" />
      <PageHeader
        title="Editar cliente"
        subtitle={`${c.nombre} ${c.apellidoPaterno} ${c.apellidoMaterno} · completa su expediente (KYC / PLD)`}
      />

      <form action={actualizarCliente.bind(null, c.id)} className="grid items-start gap-6 xl:grid-cols-2">
        <Card className="xl:col-span-2">
          <CardHeader title="Datos personales" />
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Nombre(s)" name="nombre" defaultValue={c.nombre} required />
            <Field label="Apellido paterno" name="apellidoPaterno" defaultValue={c.apellidoPaterno} required />
            <Field label="Apellido materno" name="apellidoMaterno" defaultValue={c.apellidoMaterno} />
            <Field label="CURP" name="curp" defaultValue={c.curp} placeholder="18 caracteres" />
            <Field label="RFC" name="rfc" defaultValue={c.rfc} />
            <Field label="Fecha de nacimiento" name="fechaNacimiento" type="date" defaultValue={c.fechaNacimiento?.slice(0, 10)} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Identificación oficial" subtitle="Requerida por normativa PLD" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <SelectField
              label="Tipo de identificación"
              name="tipoIdentificacion"
              options={tiposId}
              defaultValue={c.tipoIdentificacion || "INE"}
              required
            />
            <Field label="Número de identificación" name="numeroIdentificacion" defaultValue={c.numeroIdentificacion} required />
          </div>
        </Card>

        <Card>
          <CardHeader title="Contacto" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Teléfono" name="telefono" type="tel" defaultValue={c.telefono ? formatearTelefonoVista(c.telefono) : null} />
            <Field label="Correo electrónico" name="email" type="email" defaultValue={c.email} />
            <div className="sm:col-span-2">
              <Field label="Dirección" name="direccion" defaultValue={c.direccion} />
            </div>
            <div className="sm:col-span-2">
              <TextArea label="Notas" name="notas" defaultValue={c.notas} />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3 xl:col-span-2">
          <Link
            href={`/clientes/${c.id}`}
            className="inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2"
          >
            Cancelar
          </Link>
          <Button type="submit">Guardar cambios</Button>
        </div>
      </form>
    </div>
  );
}
