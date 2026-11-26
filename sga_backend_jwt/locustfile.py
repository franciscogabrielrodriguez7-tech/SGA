"""
locustfile.py — Pruebas de carga y rendimiento para SGA (Taller 6 — RNF24 / RNF25)

Seguridad operacional:
- Solo permite ejecutar pruebas contra hosts locales (localhost, 127.0.0.1) o
  un entorno de staging expresamente autorizado en SGA_LOAD_ALLOWED_STAGING_HOSTS.
- No contiene credenciales ni tokens reales. Lee credenciales sintéticas de prueba
  desde variables de entorno:
    SGA_LOAD_BASE_URL (default: http://127.0.0.1:8000)
    SGA_LOAD_EMAIL    (o SGA_LOAD_PHONE)
    SGA_LOAD_PASSWORD
"""

import os
import random
from urllib.parse import urlparse

from locust import HttpUser, between, events, task


LOCAL_HOSTS_PERMITIDOS = {"localhost", "127.0.0.1"}


def validar_host_seguro(host_url: str | None) -> None:
    """Impide ejecutar pruebas de carga accidentalmente contra producción."""
    if not host_url:
        raise ValueError("Debe definir un host objetivo local (ej. http://127.0.0.1:8000).")

    parsed = urlparse(host_url)
    hostname = (parsed.hostname or "").lower()
    staging_extra = {
        h.strip().lower()
        for h in os.getenv("SGA_LOAD_ALLOWED_STAGING_HOSTS", "").split(",")
        if h.strip()
    }
    permitidos = LOCAL_HOSTS_PERMITIDOS | staging_extra

    if hostname not in permitidos:
        raise RuntimeError(
            f"Ejecución bloqueada por seguridad: el host '{hostname}' no está autorizado "
            "(solo localhost, 127.0.0.1 o hosts listados en SGA_LOAD_ALLOWED_STAGING_HOSTS)."
        )


@events.test_start.add_listener
def _al_iniciar_prueba(environment, **kwargs):
    validar_host_seguro(environment.host)


class SgaLecturaUsuario(HttpUser):
    """
    Simula navegación realista de consulta sobre el backend del SGA sin realizar
    escrituras de negocio repetitivas durante la prueba de carga.
    """

    host = os.getenv("SGA_LOAD_BASE_URL", "http://127.0.0.1:8000")
    wait_time = between(1.0, 2.5)

    def on_start(self):
        self.token = None
        self.rol_usuario = None
        self.alquiler_ids: list[int] = []
        self.headers = {}

        password = os.getenv("SGA_LOAD_PASSWORD")
        email = os.getenv("SGA_LOAD_EMAIL")
        phone = os.getenv("SGA_LOAD_PHONE")

        if not password or (not email and not phone):
            return

        payload = {"contrasena_usuario": password}
        if email:
            payload["email_usuario"] = email
        else:
            payload["telefono_usuario"] = phone

        with self.client.post(
            "/api/sga/auth/login",
            json=payload,
            name="/api/sga/auth/login",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                cuerpo = resp.json()
                datos = cuerpo.get("data") or {}
                self.token = datos.get("access_token")
                self.rol_usuario = datos.get("rol_usuario")
                if self.token:
                    self.headers = {"Authorization": f"Bearer {self.token}"}
                    resp.success()
                else:
                    resp.failure("Respuesta 200 sin access_token")
            else:
                resp.failure(f"Error en login de usuario sintético: HTTP {resp.status_code}")

    @task(1)
    def consultar_salud_raiz(self):
        self.client.get("/", name="/ (health)")

    @task(4)
    def listar_alquileres(self):
        if not self.headers:
            return
        with self.client.get(
            "/api/sga/alquileres",
            headers=self.headers,
            name="/api/sga/alquileres",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                datos = resp.json().get("data") or []
                ids = [item.get("id_alquiler") for item in datos if isinstance(item, dict) and item.get("id_alquiler")]
                if ids:
                    self.alquiler_ids = ids[:25]
                resp.success()
            else:
                resp.failure(f"HTTP {resp.status_code}")

    @task(3)
    def listar_productos(self):
        if not self.headers:
            return
        self.client.get(
            "/api/sga/productos?solo_activos=true",
            headers=self.headers,
            name="/api/sga/productos",
        )

    @task(2)
    def listar_clientes(self):
        if not self.headers:
            return
        self.client.get(
            "/api/sga/clientes",
            headers=self.headers,
            name="/api/sga/clientes",
        )

    @task(2)
    def consultar_proximos_vencer(self):
        if not self.headers:
            return
        self.client.get(
            "/api/sga/alquileres/proximos-vencer?dias=2",
            headers=self.headers,
            name="/api/sga/alquileres/proximos-vencer",
        )

    @task(2)
    def consultar_pendientes_entrega(self):
        if not self.headers:
            return
        self.client.get(
            "/api/sga/alquileres/pendientes-entrega",
            headers=self.headers,
            name="/api/sga/alquileres/pendientes-entrega",
        )

    @task(2)
    def buscar_alquileres(self):
        if not self.headers:
            return
        self.client.get(
            "/api/sga/alquileres/buscar?barrio=Centro",
            headers=self.headers,
            name="/api/sga/alquileres/buscar",
        )

    @task(2)
    def consultar_detalle_alquiler(self):
        if not self.headers or not self.alquiler_ids:
            return
        alquiler_id = random.choice(self.alquiler_ids)
        self.client.get(
            f"/api/sga/alquileres/{alquiler_id}",
            headers=self.headers,
            name="/api/sga/alquileres/[id]",
        )
        self.client.get(
            f"/api/sga/alquileres/{alquiler_id}/detalles",
            headers=self.headers,
            name="/api/sga/alquileres/[id]/detalles",
        )

    @task(1)
    def consultar_gastos_y_logisticos(self):
        if not self.headers:
            return
        self.client.get(
            "/api/sga/gastos",
            headers=self.headers,
            name="/api/sga/gastos",
        )
        self.client.get(
            "/api/sga/usuarios?rol_usuario=encargado_logistico",
            headers=self.headers,
            name="/api/sga/usuarios?rol_usuario=encargado_logistico",
        )
        if self.rol_usuario in ("admin", "encargado_facturacion"):
            self.client.get(
                "/api/sga/gastos/resumen-semanal",
                headers=self.headers,
                name="/api/sga/gastos/resumen-semanal",
            )
