import type { Alquiler } from "../../interfaces/Alquiler";

interface DatosGeneralesSectionProps {
  alquiler: Alquiler;
}

export function DatosGeneralesSection({ alquiler }: DatosGeneralesSectionProps) {
  return (
    <div className="card stack gap-2">
      <p>
        <b>Cliente:</b> {alquiler.nombres_cliente} {alquiler.apellidos_cliente} (
        {alquiler.id_usuario_cliente})
      </p>
      <p>
        <b>Creado por:</b> {alquiler.nombres_creador} {alquiler.apellidos_creador}
      </p>
      <p>
        <b>Dirección:</b> {alquiler.direccion} — {alquiler.barrio}
      </p>
      <p>
        <b>Depósito:</b> ${alquiler.deposito.toLocaleString("es-CO")}
      </p>
      <p>
        <b>Precio del alquiler:</b> ${alquiler.precio_alquiler.toLocaleString("es-CO")}
      </p>
      <p>
        <b>Fecha de inicio:</b> {alquiler.fecha_inicio} — {alquiler.tiempo_alquiler_dias} día(s)
      </p>
      <p>
        <b>Logística:</b> {alquiler.se_lleva ? "Se lleva" : "No se lleva"} ·{" "}
        {alquiler.se_recoge ? "Se recoge" : "No se recoge"}
      </p>
    </div>
  );
}
