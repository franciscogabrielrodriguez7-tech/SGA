import asyncio
import json
import os
import unittest
from unittest.mock import MagicMock, patch

import dotenv

# Evitar lectura de archivos .env reales y configurar entorno ficticio controlado
dotenv.load_dotenv = lambda *args, **kwargs: False
os.environ["DATABASE_URL"] = "postgresql+psycopg2://ficticio:ficticio@localhost:5432/sga_test_ficticio"
os.environ["JWT_SECRET_KEY"] = "clave_ficticia_exclusiva_para_pruebas_unitarias_sga_2026"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["JWT_EXPIRE_MINUTES"] = "60"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"

from app.config import database as _db_module

# Evitar intento de conexión TCP real en el import de app.main
with patch.object(_db_module.engine, "connect", MagicMock()):
    from app.main import app

from app.config.database import get_db
from app.controllers.alquiler_controller import obtener_entregas, obtener_recogidas
from app.controllers.detalle_alquiler_controller import listar_detalles_por_alquiler
from app.utils.jwt_utils import crear_access_token


class MockRow:
    """Simula una fila SQLAlchemy con interfaz ._mapping para dict(row._mapping)."""
    def __init__(self, data: dict):
        self._mapping = data


async def _asgi_request(
    method: str,
    path: str,
    query_string: str = "",
    headers: dict | None = None,
    json_body: dict | None = None,
) -> tuple[int, dict, str]:
    """Ejecuta una petición HTTP contra la aplicación ASGI de FastAPI en memoria."""
    raw_body = json.dumps(json_body).encode("utf-8") if json_body is not None else b""
    hdrs = [(b"host", b"testserver")]
    if json_body is not None:
        hdrs.append((b"content-type", b"application/json"))
    if headers:
        for k, v in headers.items():
            hdrs.append((k.lower().encode("latin-1"), v.encode("latin-1")))

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method.upper(),
        "scheme": "http",
        "path": path,
        "raw_path": path.encode("ascii"),
        "query_string": query_string.encode("ascii"),
        "headers": hdrs,
        "client": ("127.0.0.1", 50000),
        "server": ("testserver", 80),
    }

    body_sent = False

    async def receive():
        nonlocal body_sent
        if not body_sent:
            body_sent = True
            return {"type": "http.request", "body": raw_body, "more_body": False}
        return {"type": "http.disconnect"}

    status_code = 500
    chunks: list[bytes] = []

    async def send(message):
        nonlocal status_code
        if message["type"] == "http.response.start":
            status_code = message["status"]
        elif message["type"] == "http.response.body":
            chunks.append(message.get("body", b""))

    await app(scope, receive, send)
    raw_text = b"".join(chunks).decode("utf-8")
    parsed_json = json.loads(raw_text) if raw_text else {}
    return status_code, parsed_json, raw_text


class TestPermisosCambioEstadoAlquiler(unittest.TestCase):
    """
    Verifica que PATCH /api/sga/alquileres/{id_alquiler}/estado esté restringido
    a ADMIN_O_FACTURACION (admin, encargado_facturacion) y rechace a
    encargado_logistico con 403 Forbidden.
    """

    def setUp(self):
        self.db_mock = MagicMock()
        app.dependency_overrides[get_db] = lambda: self.db_mock
        self.token_admin = crear_access_token("1001", "admin")
        self.token_facturacion = crear_access_token("1002", "encargado_facturacion")
        self.token_logistico = crear_access_token("1003", "encargado_logistico")

    def tearDown(self):
        app.dependency_overrides.clear()

    @patch("app.routes.alquiler_routes.cambiar_estado_alquiler")
    def test_01_cambiar_estado_admin_autorizado(self, mock_cambiar_estado):
        mock_cambiar_estado.return_value = {"id_alquiler": 1, "estado_alquiler": "activo"}
        headers = {"Authorization": f"Bearer {self.token_admin}"}
        status, body, _ = asyncio.run(
            _asgi_request(
                "PATCH",
                "/api/sga/alquileres/1/estado",
                headers=headers,
                json_body={"estado_alquiler": "activo"},
            )
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["code"], 200)
        self.assertEqual(body["data"]["estado_alquiler"], "activo")
        mock_cambiar_estado.assert_called_once()

    @patch("app.routes.alquiler_routes.cambiar_estado_alquiler")
    def test_02_cambiar_estado_facturacion_autorizado(self, mock_cambiar_estado):
        mock_cambiar_estado.return_value = {"id_alquiler": 1, "estado_alquiler": "activo"}
        headers = {"Authorization": f"Bearer {self.token_facturacion}"}
        status, body, _ = asyncio.run(
            _asgi_request(
                "PATCH",
                "/api/sga/alquileres/1/estado",
                headers=headers,
                json_body={"estado_alquiler": "activo"},
            )
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["code"], 200)
        self.assertEqual(body["data"]["estado_alquiler"], "activo")
        mock_cambiar_estado.assert_called_once()

    @patch("app.routes.alquiler_routes.cambiar_estado_alquiler")
    def test_03_cambiar_estado_logistico_rechazado_403(self, mock_cambiar_estado):
        headers = {"Authorization": f"Bearer {self.token_logistico}"}
        status, body, _ = asyncio.run(
            _asgi_request(
                "PATCH",
                "/api/sga/alquileres/1/estado",
                headers=headers,
                json_body={"estado_alquiler": "activo"},
            )
        )
        self.assertEqual(status, 403)
        self.assertEqual(body["code"], 403)
        self.assertEqual(body["error"], "FORBIDDEN")
        self.assertIn("no tiene permiso", body["mensaje"])
        mock_cambiar_estado.assert_not_called()

    @patch("app.routes.alquiler_routes.cambiar_estado_alquiler")
    def test_04_cambiar_estado_no_autenticado_rechazado_401(self, mock_cambiar_estado):
        status, body, _ = asyncio.run(
            _asgi_request(
                "PATCH",
                "/api/sga/alquileres/1/estado",
                json_body={"estado_alquiler": "activo"},
            )
        )
        self.assertEqual(status, 401)
        self.assertEqual(body["code"], 401)
        self.assertEqual(body["error"], "AUTH_ERROR")
        mock_cambiar_estado.assert_not_called()


class TestSubrecursosAlquilerNormalizacion(unittest.TestCase):
    """
    Verifica la normalización de respuestas en los 3 endpoints GET de subrecursos:
    - GET /api/sga/alquileres/{id}/detalles
    - GET /api/sga/alquileres/{id}/entregas
    - GET /api/sga/alquileres/{id}/recogidas
    Casos:
    A: alquiler inexistente -> 404 ALQUILER_NOT_FOUND, data: null, "El alquiler no existe"
    B: alquiler existente sin registros -> 200, data: []
    C: alquiler existente con registros -> 200, data: [...]
    """

    def setUp(self):
        self.db_mock = MagicMock()
        app.dependency_overrides[get_db] = lambda: self.db_mock
        self.token_staff = crear_access_token("1003", "encargado_logistico")
        self.headers_staff = {"Authorization": f"Bearer {self.token_staff}"}

    def tearDown(self):
        app.dependency_overrides.clear()

    # --- Controller Unit Tests (H-4: existencia del padre, consulta y retorno) ---

    def test_05a_controller_obtener_entregas_padre_inexistente_retorna_none(self):
        db = MagicMock()
        mock_res_existencia = MagicMock()
        mock_res_existencia.first.return_value = None
        db.execute.return_value = mock_res_existencia

        resultado = obtener_entregas(db, 999)

        self.assertIsNone(resultado)
        self.assertEqual(db.execute.call_count, 1)
        sql_ejecutado = str(db.execute.call_args[0][0])
        self.assertIn("SELECT 1 FROM alquiler WHERE id_alquiler = :id_alquiler", sql_ejecutado)

    def test_05b_controller_obtener_entregas_padre_existente_sin_registros_retorna_vacio(self):
        db = MagicMock()
        mock_res_existencia = MagicMock()
        mock_res_existencia.first.return_value = (1,)
        mock_res_consulta = []
        db.execute.side_effect = [mock_res_existencia, mock_res_consulta]

        resultado = obtener_entregas(db, 1)

        self.assertEqual(resultado, [])
        self.assertEqual(db.execute.call_count, 2)
        sql_1 = str(db.execute.call_args_list[0][0][0])
        sql_2 = str(db.execute.call_args_list[1][0][0])
        self.assertIn("SELECT 1 FROM alquiler", sql_1)
        self.assertIn("FROM logistica_alquiler", sql_2)
        self.assertIn("l.tipo_movimiento = 'ENTREGA'", sql_2)

    def test_05c_controller_obtener_entregas_padre_existente_con_registros_retorna_datos(self):
        db = MagicMock()
        mock_res_existencia = MagicMock()
        mock_res_existencia.first.return_value = (1,)
        datos_fila = {
            "id_logistica_alquiler": 10,
            "id_alquiler": 1,
            "id_usuario_logistico": "1003",
            "nombres_logistico": "Pedro",
            "fecha_gasto": "2026-11-23 10:00:00",
            "descripcion_gasto_logistico": "Transporte camión",
            "valor_gasto_logistico": 35000.0,
            "observaciones_logistica_alquiler": "Entrega en obra",
        }
        mock_res_consulta = [MockRow(datos_fila)]
        db.execute.side_effect = [mock_res_existencia, mock_res_consulta]

        resultado = obtener_entregas(db, 1)

        self.assertEqual(len(resultado), 1)
        self.assertEqual(resultado[0]["id_logistica_alquiler"], 10)
        self.assertEqual(resultado[0]["nombres_logistico"], "Pedro")
        self.assertEqual(db.execute.call_count, 2)

    def test_06a_controller_obtener_recogidas_padre_inexistente_retorna_none(self):
        db = MagicMock()
        mock_res_existencia = MagicMock()
        mock_res_existencia.first.return_value = None
        db.execute.return_value = mock_res_existencia

        resultado = obtener_recogidas(db, 999)

        self.assertIsNone(resultado)
        self.assertEqual(db.execute.call_count, 1)
        sql_ejecutado = str(db.execute.call_args[0][0])
        self.assertIn("SELECT 1 FROM alquiler WHERE id_alquiler = :id_alquiler", sql_ejecutado)

    def test_06b_controller_obtener_recogidas_padre_existente_sin_registros_retorna_vacio(self):
        db = MagicMock()
        mock_res_existencia = MagicMock()
        mock_res_existencia.first.return_value = (1,)
        mock_res_consulta = []
        db.execute.side_effect = [mock_res_existencia, mock_res_consulta]

        resultado = obtener_recogidas(db, 1)

        self.assertEqual(resultado, [])
        self.assertEqual(db.execute.call_count, 2)
        sql_1 = str(db.execute.call_args_list[0][0][0])
        sql_2 = str(db.execute.call_args_list[1][0][0])
        self.assertIn("SELECT 1 FROM alquiler", sql_1)
        self.assertIn("FROM logistica_alquiler", sql_2)
        self.assertIn("l.tipo_movimiento = 'RECOGIDA'", sql_2)

    def test_06c_controller_obtener_recogidas_padre_existente_con_registros_retorna_datos(self):
        db = MagicMock()
        mock_res_existencia = MagicMock()
        mock_res_existencia.first.return_value = (1,)
        datos_fila = {
            "id_logistica_alquiler": 11,
            "id_alquiler": 1,
            "id_usuario_logistico": "1003",
            "nombres_logistico": "Pedro",
            "fecha_gasto": "2026-11-23 15:00:00",
            "descripcion_gasto_logistico": "Retiro camión",
            "valor_gasto_logistico": 25000.0,
            "observaciones_logistica_alquiler": "Recogida completada",
        }
        mock_res_consulta = [MockRow(datos_fila)]
        db.execute.side_effect = [mock_res_existencia, mock_res_consulta]

        resultado = obtener_recogidas(db, 1)

        self.assertEqual(len(resultado), 1)
        self.assertEqual(resultado[0]["id_logistica_alquiler"], 11)
        self.assertEqual(resultado[0]["nombres_logistico"], "Pedro")
        self.assertEqual(db.execute.call_count, 2)

    def test_07a_controller_listar_detalles_padre_inexistente_retorna_none(self):
        db = MagicMock()
        mock_res_existencia = MagicMock()
        mock_res_existencia.first.return_value = None
        db.execute.return_value = mock_res_existencia

        resultado = listar_detalles_por_alquiler(db, 999)

        self.assertIsNone(resultado)
        self.assertEqual(db.execute.call_count, 1)
        sql_ejecutado = str(db.execute.call_args[0][0])
        self.assertIn("SELECT 1 FROM alquiler WHERE id_alquiler = :id_alquiler", sql_ejecutado)

    def test_07b_controller_listar_detalles_padre_existente_sin_registros_retorna_vacio(self):
        db = MagicMock()
        mock_res_existencia = MagicMock()
        mock_res_existencia.first.return_value = (1,)
        mock_res_consulta = []
        db.execute.side_effect = [mock_res_existencia, mock_res_consulta]

        resultado = listar_detalles_por_alquiler(db, 1)

        self.assertEqual(resultado, [])
        self.assertEqual(db.execute.call_count, 2)
        sql_1 = str(db.execute.call_args_list[0][0][0])
        sql_2 = str(db.execute.call_args_list[1][0][0])
        self.assertIn("SELECT 1 FROM alquiler", sql_1)
        self.assertIn("FROM detalle_alquiler", sql_2)

    def test_07c_controller_listar_detalles_padre_existente_con_registros_retorna_datos(self):
        db = MagicMock()
        mock_res_existencia = MagicMock()
        mock_res_existencia.first.return_value = (1,)
        datos_fila = {
            "id_detalle_alquiler": 5,
            "id_alquiler": 1,
            "id_producto": 2,
            "nombre_producto": "Andamio",
            "precio_base_producto": 15000.0,
            "precio_base_extra": 12000.0,
            "unidad_minima_alquiler": "DIA",
            "cantidad_productos": 10,
            "precio_conjunto": 450000.0,
            "es_producto_extra": False,
            "estado_registro": True,
            "fecha_creacion": "2026-11-23 10:00:00",
            "fecha_actualizacion": "2026-11-23 10:00:00",
        }
        mock_res_consulta = [MockRow(datos_fila)]
        db.execute.side_effect = [mock_res_existencia, mock_res_consulta]

        resultado = listar_detalles_por_alquiler(db, 1)

        self.assertEqual(len(resultado), 1)
        self.assertEqual(resultado[0]["id_detalle_alquiler"], 5)
        self.assertEqual(resultado[0]["nombre_producto"], "Andamio")
        self.assertEqual(db.execute.call_count, 2)

    # --- HTTP Endpoints Tests: Detalles ---

    @patch("app.routes.alquiler_routes.listar_detalles_por_alquiler")
    def test_08_get_detalles_alquiler_inexistente_404(self, mock_listar):
        mock_listar.return_value = None
        status, body, _ = asyncio.run(
            _asgi_request("GET", "/api/sga/alquileres/999/detalles", headers=self.headers_staff)
        )
        self.assertEqual(status, 404)
        self.assertEqual(body["code"], 404)
        self.assertEqual(body["error"], "ALQUILER_NOT_FOUND")
        self.assertEqual(body["mensaje"], "El alquiler no existe")
        self.assertIsNone(body["data"])

    @patch("app.routes.alquiler_routes.listar_detalles_por_alquiler")
    def test_09_get_detalles_alquiler_existente_vacio_200(self, mock_listar):
        mock_listar.return_value = []
        status, body, _ = asyncio.run(
            _asgi_request("GET", "/api/sga/alquileres/1/detalles", headers=self.headers_staff)
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["code"], 200)
        self.assertEqual(body["data"], [])

    @patch("app.routes.alquiler_routes.listar_detalles_por_alquiler")
    def test_10_get_detalles_alquiler_existente_con_datos_200(self, mock_listar):
        mock_listar.return_value = [{"id_detalle_alquiler": 10, "id_producto": 5, "nombre_producto": "Andamio"}]
        status, body, _ = asyncio.run(
            _asgi_request("GET", "/api/sga/alquileres/1/detalles", headers=self.headers_staff)
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["code"], 200)
        self.assertEqual(len(body["data"]), 1)
        self.assertEqual(body["data"][0]["nombre_producto"], "Andamio")

    # --- HTTP Endpoints Tests: Entregas ---

    @patch("app.routes.alquiler_routes.obtener_entregas")
    def test_11_get_entregas_alquiler_inexistente_404(self, mock_entregas):
        mock_entregas.return_value = None
        status, body, _ = asyncio.run(
            _asgi_request("GET", "/api/sga/alquileres/999/entregas", headers=self.headers_staff)
        )
        self.assertEqual(status, 404)
        self.assertEqual(body["code"], 404)
        self.assertEqual(body["error"], "ALQUILER_NOT_FOUND")
        self.assertEqual(body["mensaje"], "El alquiler no existe")
        self.assertIsNone(body["data"])

    @patch("app.routes.alquiler_routes.obtener_entregas")
    def test_12_get_entregas_alquiler_existente_vacio_200(self, mock_entregas):
        mock_entregas.return_value = []
        status, body, _ = asyncio.run(
            _asgi_request("GET", "/api/sga/alquileres/1/entregas", headers=self.headers_staff)
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["code"], 200)
        self.assertEqual(body["data"], [])

    @patch("app.routes.alquiler_routes.obtener_entregas")
    def test_13_get_entregas_alquiler_existente_con_datos_200(self, mock_entregas):
        mock_entregas.return_value = [{"id_logistica_alquiler": 1, "tipo_movimiento": "ENTREGA"}]
        status, body, _ = asyncio.run(
            _asgi_request("GET", "/api/sga/alquileres/1/entregas", headers=self.headers_staff)
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["code"], 200)
        self.assertEqual(len(body["data"]), 1)

    # --- HTTP Endpoints Tests: Recogidas ---

    @patch("app.routes.alquiler_routes.obtener_recogidas")
    def test_14_get_recogidas_alquiler_inexistente_404(self, mock_recogidas):
        mock_recogidas.return_value = None
        status, body, _ = asyncio.run(
            _asgi_request("GET", "/api/sga/alquileres/999/recogidas", headers=self.headers_staff)
        )
        self.assertEqual(status, 404)
        self.assertEqual(body["code"], 404)
        self.assertEqual(body["error"], "ALQUILER_NOT_FOUND")
        self.assertEqual(body["mensaje"], "El alquiler no existe")
        self.assertIsNone(body["data"])

    @patch("app.routes.alquiler_routes.obtener_recogidas")
    def test_15_get_recogidas_alquiler_existente_vacio_200(self, mock_recogidas):
        mock_recogidas.return_value = []
        status, body, _ = asyncio.run(
            _asgi_request("GET", "/api/sga/alquileres/1/recogidas", headers=self.headers_staff)
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["code"], 200)
        self.assertEqual(body["data"], [])

    @patch("app.routes.alquiler_routes.obtener_recogidas")
    def test_16_get_recogidas_alquiler_existente_con_datos_200(self, mock_recogidas):
        mock_recogidas.return_value = [{"id_logistica_alquiler": 2, "tipo_movimiento": "RECOGIDA"}]
        status, body, _ = asyncio.run(
            _asgi_request("GET", "/api/sga/alquileres/1/recogidas", headers=self.headers_staff)
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["code"], 200)
        self.assertEqual(len(body["data"]), 1)


class TestPostDetalleAlquilerComportamiento(unittest.TestCase):
    """
    Verifica que POST /api/sga/detalle-alquiler CONSERVA el código 400
    con DETALLE_VALIDATION_ERROR cuando el id_alquiler no existe.
    """

    def setUp(self):
        self.db_mock = MagicMock()
        app.dependency_overrides[get_db] = lambda: self.db_mock
        self.token_facturacion = crear_access_token("1002", "encargado_facturacion")
        self.headers_facturacion = {"Authorization": f"Bearer {self.token_facturacion}"}

    def tearDown(self):
        app.dependency_overrides.clear()

    @patch("app.routes.detalle_alquiler_routes.crear_detalle_alquiler")
    def test_17_post_detalle_alquiler_inexistente_retorna_400(self, mock_crear):
        mock_crear.side_effect = ValueError("El alquiler 9999 no existe")
        payload = {
            "id_alquiler": 9999,
            "id_producto": 1,
            "cantidad_productos": 2,
            "precio_conjunto": 50000,
            "es_producto_extra": False,
        }
        status, body, _ = asyncio.run(
            _asgi_request(
                "POST",
                "/api/sga/detalle-alquiler",
                headers=self.headers_facturacion,
                json_body=payload,
            )
        )
        self.assertEqual(status, 400)
        self.assertEqual(body["code"], 400)
        self.assertEqual(body["error"], "DETALLE_VALIDATION_ERROR")
        self.assertIn("no existe", body["mensaje"])
        self.assertIsNone(body["data"])


if __name__ == "__main__":
    unittest.main()
