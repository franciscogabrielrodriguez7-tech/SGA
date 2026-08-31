// ============================================================================
// toaster.tsx
// ----------------------------------------------------------------------------
// REEMPLAZA al toaster de Chakra UI (createToaster). Expone la MISMA API
// (`toaster.create({ title, description, type })`) para no tener que tocar
// las páginas que ya lo usan — solo cambia la implementación interna, que
// ahora es un event target simple + un componente <Toaster/> que escucha
// esos eventos y renderiza la pila de alertas con CSS puro.
// ============================================================================

import { useEffect, useState } from "react";

export interface ToastOptions {
  title: string;
  description?: string;
  type?: "info" | "success" | "warning" | "error";
}

interface ToastItem extends ToastOptions {
  id: number;
}

let contador = 0;
const bus = new EventTarget();

export const toaster = {
  create(opciones: ToastOptions) {
    const detalle: ToastItem = { ...opciones, id: ++contador };
    bus.dispatchEvent(new CustomEvent<ToastItem>("toast", { detail: detalle }));
  },
};

const DURACION_MS = 5000;

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const manejar = (evento: Event) => {
      const detalle = (evento as CustomEvent<ToastItem>).detail;

      setToasts((actuales) => [...actuales, detalle]);

      setTimeout(() => {
        setToasts((actuales) => actuales.filter((t) => t.id !== detalle.id));
      }, DURACION_MS);
    };

    bus.addEventListener("toast", manejar);
    return () => bus.removeEventListener("toast", manejar);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toaster">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type ?? "info"}`}>
          <div className="toast-title">{t.title}</div>
          {t.description && <div className="toast-description">{t.description}</div>}
        </div>
      ))}
    </div>
  );
}
