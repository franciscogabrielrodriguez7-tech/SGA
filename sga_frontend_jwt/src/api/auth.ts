import { apiRequest } from "./client";
import type { LoginPayload, LoginResponse } from "../interfaces/Usuario";

// Corresponde a app/routes/auth_routes.py del backend:
//   router = APIRouter(prefix="/auth", ...)
//   @router.post("/login")
// Montado en app/main.py bajo API_PREFIX ("/api/sga"), la ruta real es
// POST /api/sga/auth/login. Antes esto vivía como "/usuarios/login"
// dentro de usuariosApi, lo cual no existe en el backend: /usuarios
// solo tiene GET/POST/PATCH sobre /usuarios y /usuarios/{id_usuario}.
// Un POST a /usuarios/login calzaba por patrón con
// GET /usuarios/{id_usuario} (tomando "login" como id_usuario) y
// Starlette respondía 405 Method Not Allowed en vez de 404, porque el
// path existía pero no para POST.
export const authApi = {
  login(payload: LoginPayload) {
    return apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: payload,
    });
  },
};
