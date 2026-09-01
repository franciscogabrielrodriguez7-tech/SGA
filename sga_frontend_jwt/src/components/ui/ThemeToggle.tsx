// ============================================================================
// ThemeToggle.tsx
// ----------------------------------------------------------------------------
// REEMPLAZA a src/components/ui/color-mode.tsx (que dependía de next-themes
// + Chakra). Alterna un atributo data-theme="dark"/"light" en <html>, que
// tokens.css usa para redefinir las variables de color. Se persiste en
// localStorage para recordar la preferencia entre visitas.
// ============================================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sga_tema";

function obtenerTemaInicial(): "light" | "dark" {
  const guardado = localStorage.getItem(STORAGE_KEY);
  if (guardado === "light" || guardado === "dark") return guardado;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeToggle() {
  const [tema, setTema] = useState<"light" | "dark">(obtenerTemaInicial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
    localStorage.setItem(STORAGE_KEY, tema);
  }, [tema]);

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={() => setTema((actual) => (actual === "light" ? "dark" : "light"))}
      aria-label="Cambiar tema"
      title="Cambiar tema"
    >
      {tema === "light" ? "🌙" : "☀️"}
    </button>
  );
}
