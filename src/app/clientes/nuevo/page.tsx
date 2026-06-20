import Link from "next/link";
import { crearCliente } from "@/lib/actions";
import { Card, CardHeader, Button, Field, SelectField, TextArea } from "@/components/ui";
import { PageHeader } from "@/components/ui";

const tiposId = [
  { value: "INE", label: "INE / IFE" },
  { value: "Pasaporte", label: "Pasaporte" },
  { value: "Licencia", label: "Licencia de conducir" },
  { value: "Cédula", label: "Cédula profesional" },
  { value: "Otro", label: "Otro" },
];

export default function NuevoCliente() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Nuevo cliente" subtitle="Registro KYC / prevención de lavado" />

      <form action={crearCliente}>
        <Card>
          <CardHeader title="Datos personales" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Nombre(s)" name="nombre" required />
            <div />
            <Field label="Apellido paterno" name="apellidoPaterno" required />
            <Field label="Apellido materno" name="apellidoMaterno" />
            <Field label="CURP" name="curp" placeholder="18 caracteres" />
            <Field label="RFC" name="rfc" />
            <Field label="Fecha de nacimiento" name="fechaNacimiento" type="date" />
            <div />
          </div>
        </Card>

        <Card className="mt-6">
          <CardHeader title="Identificación oficial" subtitle="Requerida por normativa PLD" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <SelectField
              label="Tipo de identificación"
              name="tipoIdentificacion"
              options={tiposId}
              defaultValue="INE"
              required
            />
            <Field
              label="Número de identificación"
              name="numeroIdentificacion"
              required
            />
          </div>
        </Card>

        <Card className="mt-6">
          <CardHeader title="Contacto" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Teléfono" name="telefono" type="tel" />
            <Field label="Correo electrónico" name="email" type="email" />
            <div className="sm:col-span-2">
              <Field label="Dirección" name="direccion" />
            </div>
            <div className="sm:col-span-2">
              <TextArea label="Notas" name="notas" />
            </div>
          </div>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <Link
            href="/clientes"
            className="inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2"
          >
            Cancelar
          </Link>
          <Button type="submit">Guardar cliente</Button>
        </div>
      </form>
    </div>
  );
}
