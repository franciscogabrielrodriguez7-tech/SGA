import asyncio
import json
import os
import unittest
from datetime import datetime
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
from app.models.alquiler import Alquiler
from app.models.usuario import Usuario
from app.utils.jwt_utils import crear_access_token
from app.utils.response import _orm_to_dict, convertir_json, response_success

HASH_FICTICIO_STAFF = "HASH_FICTICIO_CONTROLADO_STAFF_NO_EXPONER_001"
HASH_FICTICIO_CLIENTE = "HASH_FICTICIO_CONTROLADO_CLIENTE_NO_EXPONER_002"

CAMPOS_LEGITIMOS_USUARIO = {
    "id_usuario",
    "rol_usuario",
    "nombres_usuario",
    "apellidos_usuario",
    "email_usuario",
    "telefono_usuario",
    "tipo_documento",
    "estado_registro",
    "fecha_creacion",
    "fecha_actualizacion",
}


def _crear_usuario_ficticio(
    id_usuario: str = "1001",
    rol_usuario: str = "admin",
    nombres: str = "Usuario",
    apellidos: str = "Prueba",
    email: str = "prueba@ficticio.local",
    telefono: str = "3000000001",
    hash_ficticio: str = HASH_FICTICIO_STAFF,
    tipo_documento: str = "CC",
) -> Usuario:
    return Usuario(
        id_usuario=id_usuario,
        rol_usuario=rol_usuario,
        nombres_usuario=nombres,
        apellidos_usuario=apellidos,
        email_usuario=email,
        telefono_usuario=telefono,
        contrasena_usuario=hash_ficticio,
        tipo_documento=tipo_documento,
        estado_registro=True,
        fecha_creacion=datetime(2026, 11, 23, 10, 0, 0),
        fecha_actualizacion=datetime(2026, 11, 23, 10, 0, 0),
    )


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
    return status_code, json.loads(raw_text), raw_text


class TestSeguridadSerializacionUsuario(unittest.TestCase):
    """
    Pruebas automatizadas para verificar que contrasena_usuario y cualquier
    valor de hash nunca se exponen en las respuestas de la API ni en
    serializaciones anidadas o indirectas.
    """

    def setUp(self):
        self.db_mock = MagicMock()
        app.dependency_overrides[get_db] = lambda: self.db_mock
        self.token_admin = crear_access_token("1001", "admin")
        self.headers_admin = {"Authorization": f"Bearer {self.token_admin}"}

    def tearDown(self):
        app.dependency_overrides.clear()

    def _verificar_ausencia_credenciales(self, payload_json: dict, raw_text: str):
        self.assertNotIn("contrasena_usuario", raw_text)
        self.assertNotIn(HASH_FICTICIO_STAFF, raw_text)
        self.assertNotIn(HASH_FICTICIO_CLIENTE, raw_text)

    @patch("app.routes.usuario_routes.obtener_usuarios")
    def test_01_get_usuarios_no_expone_contrasena_ni_hash(self, mock_obtener_usuarios):
        u1 = _crear_usuario_ficticio(id_usuario="1001", rol_usuario="admin")
        u2 = _crear_usuario_ficticio(
            id_usuario="1002",
            rol_usuario="encargado_logistico",
            email="log@ficticio.local",
            telefono="3000000002",
        )
        mock_obtener_usuarios.return_value = [u1, u2]

        status, body, raw_text = asyncio.run(
            _asgi_request("GET", "/api/sga/usuarios", headers=self.headers_admin)
        )

        self.assertEqual(status, 200)
        self.assertTrue(body["status"])
        self._verificar_ausencia_credenciales(body, raw_text)
        self.assertEqual(len(body["data"]), 2)
        for item in body["data"]:
            self.assertNotIn("contrasena_usuario", item)
            self.assertEqual(set(item.keys()), CAMPOS_LEGITIMOS_USUARIO)

    @patch("app.routes.usuario_routes.obtener_usuario")
    def test_02_get_usuario_por_id_no_expone_contrasena_ni_hash(self, mock_obtener_usuario):
        u1 = _crear_usuario_ficticio(id_usuario="1001", rol_usuario="admin")
        mock_obtener_usuario.return_value = u1

        status, body, raw_text = asyncio.run(
            _asgi_request("GET", "/api/sga/usuarios/1001", headers=self.headers_admin)
        )

        self.assertEqual(status, 200)
        self.assertTrue(body["status"])
        self._verificar_ausencia_credenciales(body, raw_text)
        self.assertNotIn("contrasena_usuario", body["data"])
        self.assertEqual(set(body["data"].keys()), CAMPOS_LEGITIMOS_USUARIO)

    @patch("app.routes.cliente_routes.obtener_clientes")
    def test_03_get_clientes_no_expone_contrasena_ni_hash(self, mock_obtener_clientes):
        c1 = _crear_usuario_ficticio(
            id_usuario="2001",
            rol_usuario="cliente",
            hash_ficticio=HASH_FICTICIO_CLIENTE,
        )
        mock_obtener_clientes.return_value = [c1]

        status, body, raw_text = asyncio.run(
            _asgi_request("GET", "/api/sga/clientes", headers=self.headers_admin)
        )

        self.assertEqual(status, 200)
        self.assertTrue(body["status"])
        self._verificar_ausencia_credenciales(body, raw_text)
        self.assertEqual(len(body["data"]), 1)
        self.assertNotIn("contrasena_usuario", body["data"][0])
        self.assertEqual(set(body["data"][0].keys()), CAMPOS_LEGITIMOS_USUARIO)

    @patch("app.routes.cliente_routes.obtener_cliente")
    def test_04_get_cliente_por_id_no_expone_contrasena_ni_hash(self, mock_obtener_cliente):
        c1 = _crear_usuario_ficticio(
            id_usuario="2001",
            rol_usuario="cliente",
            hash_ficticio=HASH_FICTICIO_CLIENTE,
        )
        mock_obtener_cliente.return_value = c1

        status, body, raw_text = asyncio.run(
            _asgi_request("GET", "/api/sga/clientes/2001", headers=self.headers_admin)
        )

        self.assertEqual(status, 200)
        self.assertTrue(body["status"])
        self._verificar_ausencia_credenciales(body, raw_text)
        self.assertNotIn("contrasena_usuario", body["data"])
        self.assertEqual(set(body["data"].keys()), CAMPOS_LEGITIMOS_USUARIO)

    @patch("app.controllers.usuario_controller.verificar_contrasena", return_value=True)
    def test_05_post_auth_login_no_expone_contrasena_ni_hash(self, _mock_verificar):
        fila_mock = MagicMock()
        fila_mock.id_usuario = "1001"
        fila_mock.rol_usuario = "admin"
        fila_mock.nombres_usuario = "Usuario"
        fila_mock.apellidos_usuario = "Prueba"
        fila_mock.contrasena_usuario = HASH_FICTICIO_STAFF
        fila_mock.estado_registro = True
        self.db_mock.execute.return_value.first.return_value = fila_mock

        status, body, raw_text = asyncio.run(
            _asgi_request(
                "POST",
                "/api/sga/auth/login",
                json_body={
                    "email_usuario": "prueba@ficticio.local",
                    "contrasena_usuario": "clave_plana_ficticia",
                },
            )
        )

        self.assertEqual(status, 200)
        self.assertTrue(body["status"])
        self._verificar_ausencia_credenciales(body, raw_text)
        self.assertEqual(
            set(body["data"].keys()),
            {
                "logueado",
                "id_usuario",
                "rol_usuario",
                "nombres_usuario",
                "apellidos_usuario",
                "access_token",
                "token_type",
            },
        )

    def test_06_serializacion_anidada_orm_y_dicts_excluye_contrasena_y_propiedades_no_publicas(self):
        creador = _crear_usuario_ficticio(id_usuario="1001", rol_usuario="admin")
        cliente = _crear_usuario_ficticio(
            id_usuario="2001",
            rol_usuario="cliente",
            hash_ficticio=HASH_FICTICIO_CLIENTE,
        )
        # Simular atributo sensible futuro no incluido en __campos_publicos__
        creador.token_secreto_futuro = "SECRETO_FUTURO_NO_EXPONER"

        alquiler_orm = Alquiler(
            id_alquiler=99,
            id_usuario_creador="1001",
            id_usuario_cliente="2001",
            estado_alquiler="activo",
            barrio="Centro",
            direccion="Calle 1",
        )
        alquiler_orm.creador = creador
        alquiler_orm.cliente = cliente

        estructura_compleja = {
            "alquiler_anidado": alquiler_orm,
            "usuarios_lista": [creador, cliente],
            "snapshot_dict": {
                "id_usuario": "1001",
                "contrasena_usuario": HASH_FICTICIO_STAFF,
                "subnivel": {"password_hash": HASH_FICTICIO_CLIENTE, "ok": True},
            },
        }

        respuesta = response_success("Prueba anidada", data=estructura_compleja)
        raw_text = respuesta.body.decode("utf-8")
        body = json.loads(raw_text)

        self._verificar_ausencia_credenciales(body, raw_text)
        self.assertNotIn("token_secreto_futuro", raw_text)
        self.assertNotIn("SECRETO_FUTURO_NO_EXPONER", raw_text)
        self.assertNotIn("password_hash", raw_text)
        self.assertEqual(
            set(body["data"]["alquiler_anidado"]["creador"].keys()),
            CAMPOS_LEGITIMOS_USUARIO,
        )
        self.assertEqual(
            set(body["data"]["alquiler_anidado"]["cliente"].keys()),
            CAMPOS_LEGITIMOS_USUARIO,
        )
        self.assertTrue(body["data"]["snapshot_dict"]["subnivel"]["ok"])

    def test_07_orm_to_dict_y_convertir_json_directos(self):
        u = _crear_usuario_ficticio()
        d = _orm_to_dict(u)
        self.assertNotIn("contrasena_usuario", d)
        self.assertEqual(set(d.keys()), CAMPOS_LEGITIMOS_USUARIO)

        json_limpio = convertir_json({"usuario": u, "contrasena_usuario": HASH_FICTICIO_STAFF})
        self.assertNotIn("contrasena_usuario", json_limpio)
        self.assertNotIn("contrasena_usuario", json_limpio["usuario"])

    @patch("app.routes.usuario_routes.crear_usuario")
    @patch("app.routes.usuario_routes.actualizar_usuario")
    @patch("app.routes.cliente_routes.crear_cliente")
    @patch("app.routes.cliente_routes.actualizar_cliente")
    def test_08_escrituras_usuarios_y_clientes_no_exponen_contrasena_ni_hash(
        self,
        mock_act_cliente,
        mock_crear_cliente,
        mock_act_usuario,
        mock_crear_usuario,
    ):
        u_staff = _crear_usuario_ficticio(id_usuario="1005", rol_usuario="encargado_facturacion")
        u_cli = _crear_usuario_ficticio(
            id_usuario="2005",
            rol_usuario="cliente",
            hash_ficticio=HASH_FICTICIO_CLIENTE,
        )
        mock_crear_usuario.return_value = u_staff
        mock_act_usuario.return_value = u_staff
        mock_crear_cliente.return_value = u_cli
        mock_act_cliente.return_value = u_cli

        casos = [
            (
                "POST",
                "/api/sga/usuarios",
                {
                    "id_usuario": "1005",
                    "rol_usuario": "encargado_facturacion",
                    "nombres_usuario": "Usuario",
                    "apellidos_usuario": "Prueba",
                    "email_usuario": "u1005@ficticio.local",
                    "telefono_usuario": "3000001005",
                    "contrasena_usuario": "clave_ficticia",
                    "tipo_documento": "CC",
                },
                201,
            ),
            (
                "PATCH",
                "/api/sga/usuarios/1005",
                {"nombres_usuario": "Usuario Editado"},
                200,
            ),
            (
                "POST",
                "/api/sga/clientes",
                {
                    "id_usuario": "2005",
                    "nombres_usuario": "Cliente",
                    "apellidos_usuario": "Prueba",
                    "telefono_usuario": "3000002005",
                    "tipo_documento": "CC",
                },
                201,
            ),
            (
                "PATCH",
                "/api/sga/clientes/2005",
                {"nombres_usuario": "Cliente Editado"},
                200,
            ),
        ]

        for metodo, ruta, payload, esperado in casos:
            status, body, raw_text = asyncio.run(
                _asgi_request(metodo, ruta, headers=self.headers_admin, json_body=payload)
            )
            self.assertEqual(status, esperado)
            self._verificar_ausencia_credenciales(body, raw_text)


if __name__ == "__main__":
    unittest.main()
