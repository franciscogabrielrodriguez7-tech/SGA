// ============================================================================
// client.ts — Cliente HTTP base para la API del backend SGA (VARIANTE CON JWT)
// ----------------------------------------------------------------------------
// El backend responde SIEMPRE con el mismo sobre (ver app/utils/response.py
// del backend):
//   { status: boolean, mensaje: string, data: T | null, error: string | null, code: number }
//
// Este cliente:
//  - arma la URL a partir de VITE_API_URL (ver .env.example)
//  - serializa/deserializa JSON
//  - NUEVO respecto a la variante sin JWT: adjunta automáticamente el
//    header "Authorization: Bearer <token>" en cada petición, leyendo el
//    token guardado por AuthContext en localStorage
//  - NUEVO: si el backend responde 401 (token vencido/inválido), dispara
//    el evento global "sesionExpirada" para que AuthContext cierre la
//    sesión, y deja que el ApiError se propague igual (así la pantalla
//    que hizo la petición también puede mostrar su propio mensaje)
//  - normaliza errores de red (backend caído, CORS, etc.) al MISMO formato
//    del sobre, para que el resto del código nunca tenga que distinguir
//    "error de red" de "error de negocio devuelto por el backend"
//  - lanza ApiError cuando status=false, con el mensaje ya listo para
//    mostrar en un toast
// ============================================================================

const BASE_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/sga"
).replace(/\/+$/, "");

const STORAGE_KEY = "sga_sesion_usuario";

function obtenerTokenGuardado(): string | null {
  const guardado = localStorage.getItem(STORAGE_KEY);
  if (!guardado) return null;

  try {
    const datos = JSON.parse(guardado);
    return datos?.access_token ?? null;
  } catch {
    return null;
  }
}

export interface ApiEnvelope<T> {
  status: boolean;
  mensaje: string;
  data: T | null;
  error: string | null;
  code: number;
}

export class ApiError extends Error {
  code: number;
  errorCode: string | null;

  constructor(mensaje: string, code: number, errorCode: string | null) {
    super(mensaje);
    this.name = "ApiError";
    this.code = code;
    this.errorCode = errorCode;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
}

function construirQueryString(
  params?: RequestOptions["params"],
): string {
  if (!params) return "";

  const entradas = Object.entries(params).filter(
    ([, valor]) => valor !== undefined && valor !== null && valor !== "",
  );

  if (entradas.length === 0) return "";

  const buscador = new URLSearchParams();

  entradas.forEach(([clave, valor]) => {
    buscador.set(clave, String(valor));
  });

  return `?${buscador.toString()}`;
}

export async function apiRequest<T>(
  ruta: string,
  opciones: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, params } = opciones;

  const url = `${BASE_URL}${ruta}${construirQueryString(params)}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = obtenerTokenGuardado();

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let respuesta: Response;

  try {
    respuesta = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Error de red real (backend caído, CORS, sin conexión, etc.)
    throw new ApiError(
      "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.",
      0,
      "NETWORK_ERROR",
    );
  }

  let sobre: ApiEnvelope<T> | null = null;

  try {
    sobre = await respuesta.json();
  } catch {
    // El backend no devolvió JSON válido (por ejemplo, un 500 sin manejar
    // o el servidor equivocado en esa URL)
    throw new ApiError(
      `Respuesta inesperada del servidor (HTTP ${respuesta.status}).`,
      respuesta.status,
      "INVALID_RESPONSE",
    );
  }

  if (!sobre || !sobre.status) {
    // NUEVO: token vencido/inválido -> forzar cierre de sesión global.
    // No se hace para la propia ruta de login (401 = credenciales
    // incorrectas, no sesión expirada) para no entrar en bucle.
    if (respuesta.status === 401 && !ruta.includes("/login")) {
      window.dispatchEvent(new Event("sesionExpirada"));
    }

    throw new ApiError(
      sobre?.mensaje ?? "Ocurrió un error al comunicarse con el servidor.",
      sobre?.code ?? respuesta.status,
      sobre?.error ?? null,
    );
  }

  return sobre.data as T;
}

