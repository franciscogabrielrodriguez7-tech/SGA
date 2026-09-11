import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { alquileresApi } from "../../api/alquileres";
import { ApiError } from "../../api/client";
import type { Alquiler } from "../../interfaces/Alquiler";
import { toaster } from "../../components/ui/toaster";

function TarjetaAlquiler({ alquiler }: { alquiler: Alquiler }) {
  return (
    <RouterLink to={`/alquileres/${alquiler.id_alquiler}`} className="card card-clickable">
      <div className="stack gap-1">
        <p className="text-bold">
          #{alquiler.id_alquiler} — {alquiler.nombres_cliente}{" "}
          {alquiler.apellidos_cliente}
        </p>
        <p className="text-sm text-muted">
          {alquiler.barrio} · vence {alquiler.fecha_vencimiento}
        </p>
        <span className="badge" style={{ alignSelf: "flex-start" }}>
          {alquiler.estado_alquiler}
        </span>
      </div>
    </RouterLink>
  );
}

export function Dashboard() {
  const [proximosAVencer, setProximosAVencer] = useState<Alquiler[]>([]);
  const [pendientesEntrega, setPendientesEntrega] = useState<Alquiler[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const [vencer, entrega] = await Promise.all([
          alquileresApi.proximosAVencer(2),
          alquileresApi.pendientesEntrega(),
        ]);

        setProximosAVencer(vencer);
        setPendientesEntrega(entrega);
      } catch (error) {
        const mensaje =
          error instanceof ApiError ? error.message : "Error al cargar el panel";

        toaster.create({ title: "Error", description: mensaje, type: "error" });
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, []);

  return (
    <div className="stack gap-8">
      <div className="stack gap-1">
        <h1 className="heading-2xl">Panel de control</h1>
        <p className="text-muted">Resumen operativo de alquileres.</p>
      </div>

      <div>
        <h2 className="heading-md" style={{ marginBottom: 12 }}>
          Próximos a vencer (2 días) — RN-VEN-01
        </h2>

        {!cargando && proximosAVencer.length === 0 && (
          <p className="text-muted">No hay alquileres próximos a vencer.</p>
        )}

        <div className="grid grid-cols-1 grid-cols-2-md grid-cols-3-lg">
          {proximosAVencer.map((a) => (
            <TarjetaAlquiler key={a.id_alquiler} alquiler={a} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="heading-md" style={{ marginBottom: 12 }}>
          Pendientes por entregar
        </h2>

        {!cargando && pendientesEntrega.length === 0 && (
          <p className="text-muted">No hay alquileres pendientes de entrega.</p>
        )}

        <div className="grid grid-cols-1 grid-cols-2-md grid-cols-3-lg">
          {pendientesEntrega.map((a) => (
            <TarjetaAlquiler key={a.id_alquiler} alquiler={a} />
          ))}
        </div>
      </div>

      <RouterLink to="/alquileres" className="text-brand">
        Ver todos los alquileres →
      </RouterLink>
    </div>
  );
}
