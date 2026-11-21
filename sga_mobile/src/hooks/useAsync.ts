import { useEffect, useState } from "react";

export type EstadoCarga<T> =
  | { estado: "cargando" }
  | { estado: "error"; mensaje: string }
  | { estado: "ok"; datos: T };

// Carga asíncrona con estados explícitos (cargando / error / ok) y recarga.
export function useAsync<T>(cargar: () => Promise<T>, deps: unknown[]) {
  const [estado, setEstado] = useState<EstadoCarga<T>>({ estado: "cargando" });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vivo = true;
    setEstado({ estado: "cargando" });
    cargar()
      .then((datos) => vivo && setEstado({ estado: "ok", datos }))
      .catch((e: unknown) =>
        vivo && setEstado({ estado: "error", mensaje: e instanceof Error ? e.message : "Error desconocido" }),
      );
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  return { estado, recargar: () => setVersion((v) => v + 1) };
}
