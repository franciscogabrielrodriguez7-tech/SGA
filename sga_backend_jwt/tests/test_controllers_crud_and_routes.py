import asyncio
import json
import os
import unittest
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import dotenv
from sqlalchemy.exc import DBAPIError

dotenv.load_dotenv = lambda *args, **kwargs: False
os.environ["DATABASE_URL"] = (
    "postgresql+psycopg2://ficticio:ficticio@localhost:5432/sga_test_ficticio"
)
os.environ["JWT_SECRET_KEY"] = (
    "clave_ficticia_exclusiva_para_pruebas_unitarias_sga_2026"
)
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["JWT_EXPIRE_MINUTES"] = "60"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"

from app.config import database as _db_module

with patch.object(_db_module.engine, "connect", MagicMock()):
    from app.main import app

from app.config.database import get_db
from app.controllers import (
    auditoria_controller,
    cliente_controller,
    detalle_alquiler_controller,
    logistica_alquiler_controller,
    producto_controller,
    usuario_controller,
)
from app.models.alquiler import Alquiler
from app.models.detalle_alquiler import DetalleAlquiler
from app.models.producto import Producto
from app.models.usuario import Usuario
from app.schemas.cliente_schema import ClienteCreate, ClienteUpdate
from app.schemas.detalle_alquiler_schema import DetalleAlquilerCreate, DetalleAlquilerUpdate
from app.schemas.logistica_alquiler_schema import GastoCreate
from app.schemas.producto_schema import ProductoCreate, ProductoUpdate
from app.schemas.usuario_schema import UsuarioCreate, UsuarioUpdate
from app.utils.auth_dependency import UsuarioActual
from app.utils.jwt_utils import crear_access_token
from app.utils.security import hashear_contrasena


class MockRow:
    def __init__(self, data: dict):
        self._mapping = data


async def _asgi_request(
    method: str,
    path: str,
    query_string: str = "",
    headers: dict | None = None,
    json_body: dict | None = None,
) -> tuple[int, dict, str]:
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


def _make_query(first_val=None, all_val=None):
    q = MagicMock()
    q.filter.return_value = q
    q.order_by.return_value = q
    q.options.return_value = q
    q.join.return_value = q
    q.first.return_value = first_val
    q.all.return_value = all_val if all_val is not None else []
    return q


class TestControllersCRUD(unittest.TestCase):
    def setUp(self):
        self.actor = UsuarioActual("1001", "admin")

    def test_producto_controller_crud_y_errores(self):
        db = MagicMock()
        datos = ProductoCreate(
            nombre_producto="Andamio tubular",
            precio_base_producto=Decimal("10000"),
            stock_total=25,
            unidad_minima_alquiler="DIA",
        )
        prod = producto_controller.crear_producto(db, datos, self.actor)
        self.assertEqual(prod.precio_base_extra, Decimal("10000"))
        db.commit.assert_called_once()

        db_err = MagicMock()
        db_err.commit.side_effect = DBAPIError("stmt", {}, Exception("Stock inválido"))
        with self.assertRaises(ValueError):
            producto_controller.crear_producto(db_err, datos, self.actor)
        db_err.rollback.assert_called_once()

        # obtener_productos con solo_activos True / False
        q = _make_query(all_val=[prod])
        db.query.return_value = q
        self.assertEqual(len(producto_controller.obtener_productos(db, True)), 1)
        self.assertEqual(len(producto_controller.obtener_productos(db, False)), 1)

        # actualizar_producto no encontrado, sin cambios, con cambios y DBAPIError
        db.query.return_value = _make_query(first_val=None)
        self.assertIsNone(producto_controller.actualizar_producto(db, 99, ProductoUpdate(), self.actor))

        p_obj = Producto(id_producto=1, nombre_producto="Cruceta", stock_total=10, stock_alquilado=0)
        db.query.return_value = _make_query(first_val=p_obj)
        self.assertIs(producto_controller.actualizar_producto(db, 1, ProductoUpdate(), self.actor), p_obj)

        upd = ProductoUpdate(nombre_producto="Cruceta XL")
        res = producto_controller.actualizar_producto(db, 1, upd, self.actor)
        self.assertEqual(res.nombre_producto, "Cruceta XL")

        db.commit.side_effect = DBAPIError("stmt", {}, Exception("stock_total menor"))
        with self.assertRaises(ValueError):
            producto_controller.actualizar_producto(db, 1, upd, self.actor)

        # cambiar_estado_producto
        db.commit.side_effect = None
        db.query.return_value = _make_query(first_val=None)
        self.assertIsNone(producto_controller.cambiar_estado_producto(db, 99, False, self.actor))
        db.query.return_value = _make_query(first_val=p_obj)
        self.assertIs(producto_controller.cambiar_estado_producto(db, 1, False, self.actor), p_obj)
        db.commit.side_effect = DBAPIError("stmt", {}, Exception("En obra"))
        with self.assertRaises(ValueError):
            producto_controller.cambiar_estado_producto(db, 1, False, self.actor)

    def test_cliente_controller_crud_y_duplicados(self):
        datos = ClienteCreate(
            id_usuario="9001",
            nombres_usuario="Carlos",
            apellidos_usuario="Ruiz",
            telefono_usuario="3001112233",
            email_usuario="carlos@example.com",
            tipo_documento="CC",
        )
        db = MagicMock()
        # Duplicado id_usuario, teléfono y email
        db.query.return_value = _make_query(first_val=Usuario(id_usuario="9001"))
        with self.assertRaises(ValueError):
            cliente_controller.crear_cliente(db, datos, self.actor)

        q_id_ok = _make_query(first_val=None)
        q_tel_dup = _make_query(first_val=Usuario(id_usuario="9002"))
        db.query.side_effect = [q_id_ok, q_tel_dup]
        with self.assertRaises(ValueError):
            cliente_controller.crear_cliente(db, datos, self.actor)

        db.query.side_effect = [_make_query(None), _make_query(None), _make_query(Usuario(id_usuario="9003"))]
        with self.assertRaises(ValueError):
            cliente_controller.crear_cliente(db, datos, self.actor)

        db.query.side_effect = [_make_query(None), _make_query(None), _make_query(None)]
        cli = cliente_controller.crear_cliente(db, datos, self.actor)
        self.assertEqual(cli.rol_usuario, "cliente")
        self.assertIsNone(cli.contrasena_usuario)

        # DBAPIError en crear
        db.query.side_effect = [_make_query(None), _make_query(None), _make_query(None)]
        db.commit.side_effect = DBAPIError("stmt", {}, Exception("Error BD"))
        with self.assertRaises(ValueError):
            cliente_controller.crear_cliente(db, datos, self.actor)

        # obtener_clientes con y sin búsqueda
        db.commit.side_effect = None
        db.query.side_effect = None
        db.query.return_value = _make_query(all_val=[cli])
        self.assertEqual(len(cliente_controller.obtener_clientes(db, "Carlos")), 1)
        self.assertEqual(len(cliente_controller.obtener_clientes(db)), 1)

        # actualizar_cliente
        db.query.return_value = _make_query(None)
        self.assertIsNone(cliente_controller.actualizar_cliente(db, "404", ClienteUpdate(), self.actor))

        db.query.side_effect = [_make_query(cli), _make_query(cli)]
        self.assertIs(cliente_controller.actualizar_cliente(db, "9001", ClienteUpdate(), self.actor), cli)

        db.query.side_effect = [_make_query(cli), _make_query(Usuario(id_usuario="9002"))]
        with self.assertRaises(ValueError):
            cliente_controller.actualizar_cliente(
                db, "9001", ClienteUpdate(telefono_usuario="3009999999"), self.actor
            )

        db.query.side_effect = [_make_query(cli), _make_query(None)]
        act = cliente_controller.actualizar_cliente(
            db, "9001", ClienteUpdate(telefono_usuario="3009999999"), self.actor
        )
        self.assertEqual(act.telefono_usuario, "3009999999")

        # cambiar_estado_cliente
        db.query.side_effect = None
        db.query.return_value = _make_query(None)
        self.assertIsNone(cliente_controller.cambiar_estado_cliente(db, "404", False, self.actor))
        db.query.return_value = _make_query(cli)
        self.assertFalse(cliente_controller.cambiar_estado_cliente(db, "9001", False, self.actor).estado_registro)
        db.commit.side_effect = DBAPIError("stmt", {}, Exception("Trigger error"))
        with self.assertRaises(ValueError):
            cliente_controller.cambiar_estado_cliente(db, "9001", True, self.actor)

    def test_usuario_controller_crud_y_login(self):
        datos = UsuarioCreate(
            id_usuario="2001",
            rol_usuario="encargado_logistico",
            nombres_usuario="Luis",
            apellidos_usuario="Gomez",
            telefono_usuario="3012223344",
            email_usuario="luis@example.com",
            contrasena_usuario="Secreta1234",
            tipo_documento="CC",
        )
        db = MagicMock()
        db.query.side_effect = [_make_query(None), _make_query(None), _make_query(None)]
        usr = usuario_controller.crear_usuario(db, datos, self.actor)
        self.assertNotEqual(usr.contrasena_usuario, "Secreta1234")

        db.query.side_effect = [_make_query(usr)]
        with self.assertRaises(ValueError):
            usuario_controller.crear_usuario(db, datos, self.actor)

        # obtener_usuarios
        db.query.side_effect = None
        db.query.return_value = _make_query(all_val=[usr])
        self.assertEqual(len(usuario_controller.obtener_usuarios(db, "admin")), 1)
        self.assertEqual(len(usuario_controller.obtener_usuarios(db, None)), 1)

        # actualizar_usuario
        db.query.return_value = _make_query(None)
        self.assertIsNone(usuario_controller.actualizar_usuario(db, "404", UsuarioUpdate(), self.actor))

        db.query.side_effect = [_make_query(usr), _make_query(usr)]
        self.assertIs(usuario_controller.actualizar_usuario(db, "2001", UsuarioUpdate(), self.actor), usr)

        db.query.side_effect = [_make_query(usr)]
        db.execute.return_value.first.return_value = ("otro",)
        with self.assertRaises(ValueError):
            usuario_controller.actualizar_usuario(
                db, "2001", UsuarioUpdate(telefono_usuario="399"), self.actor
            )

        db.query.side_effect = [_make_query(usr)]
        db.execute.return_value.first.side_effect = [None, ("otro",)]
        with self.assertRaises(ValueError):
            usuario_controller.actualizar_usuario(
                db, "2001", UsuarioUpdate(telefono_usuario="399", email_usuario="a@b.com"), self.actor
            )

        db.execute.return_value.first.side_effect = None
        db.execute.return_value.first.return_value = None
        db.query.side_effect = [_make_query(usr)]
        upd_usr = usuario_controller.actualizar_usuario(
            db, "2001", UsuarioUpdate(contrasena_usuario="NuevaClave123"), self.actor
        )
        self.assertTrue(upd_usr.contrasena_usuario.startswith("$2"))

        # cambiar_estado_usuario
        db.query.side_effect = None
        db.query.return_value = _make_query(None)
        self.assertIsNone(usuario_controller.cambiar_estado_usuario(db, "404", False, self.actor))
        db.query.return_value = _make_query(usr)
        self.assertFalse(usuario_controller.cambiar_estado_usuario(db, "2001", False, self.actor).estado_registro)
        db.commit.side_effect = DBAPIError("stmt", {}, Exception("Mínimo un admin"))
        with self.assertRaises(ValueError):
            usuario_controller.cambiar_estado_usuario(db, "2001", False, self.actor)

        # login_usuario casos
        with self.assertRaises(ValueError):
            usuario_controller.login_usuario(db, "clave")

        db.execute.return_value.first.return_value = None
        self.assertIsNone(usuario_controller.login_usuario(db, "clave", email_usuario="no@x.com"))

        hash_ok = hashear_contrasena("ClaveValida123")
        db.execute.return_value.first.return_value = SimpleNamespace(
            id_usuario="99", rol_usuario="cliente", nombres_usuario="C",
            apellidos_usuario="D", contrasena_usuario=hash_ok, estado_registro=True
        )
        self.assertIsNone(usuario_controller.login_usuario(db, "ClaveValida123", telefono_usuario="300"))

        db.execute.return_value.first.return_value = SimpleNamespace(
            id_usuario="99", rol_usuario="admin", nombres_usuario="A",
            apellidos_usuario="B", contrasena_usuario=hash_ok, estado_registro=False
        )
        self.assertIsNone(usuario_controller.login_usuario(db, "ClaveValida123", email_usuario="a@b.com"))

        db.execute.return_value.first.return_value = SimpleNamespace(
            id_usuario="99", rol_usuario="admin", nombres_usuario="A",
            apellidos_usuario="B", contrasena_usuario=hash_ok, estado_registro=True
        )
        self.assertIsNone(usuario_controller.login_usuario(db, "Incorrecta", email_usuario="a@b.com"))
        res_ok = usuario_controller.login_usuario(db, "ClaveValida123", email_usuario="a@b.com")
        self.assertTrue(res_ok["logueado"])
        self.assertIn("access_token", res_ok)

    def test_logistica_detalle_y_auditoria_controllers(self):
        db = MagicMock()
        gasto_in = GastoCreate(
            ids_alquiler=[1, 2],
            valor_gasto_logistico=Decimal("45000"),
            descripcion_gasto_logistico="Flete camioneta",
        )
        res_g = logistica_alquiler_controller.crear_gasto(db, gasto_in, self.actor)
        self.assertEqual(res_g["tipo_movimiento"], "GASTO")
        self.assertEqual(res_g["ids_alquiler"], [1, 2])

        db_err = MagicMock()
        db_err.commit.side_effect = DBAPIError("stmt", {}, Exception("FK invalida"))
        with self.assertRaises(ValueError):
            logistica_alquiler_controller.crear_gasto(db_err, gasto_in, self.actor)

        db.execute.return_value = [MockRow({"id_logistica_alquiler": 1, "valor_gasto_logistico": 45000})]
        self.assertEqual(len(logistica_alquiler_controller.obtener_gastos(db, 1)), 1)
        db.execute.return_value = [MockRow({"semana_inicio": "2026-11-23", "cantidad_registros": 2})]
        self.assertEqual(len(logistica_alquiler_controller.resumen_semanal_gastos(db)), 1)

        # detalle_alquiler_controller
        db.execute = MagicMock()
        alq_cerrado = Alquiler(id_alquiler=5, estado_alquiler="terminado")
        db.query.return_value = _make_query(alq_cerrado)
        with self.assertRaises(ValueError):
            detalle_alquiler_controller._obtener_alquiler_o_error(db, 5)

        alq_activo = Alquiler(id_alquiler=5, estado_alquiler="activo")
        db.query.return_value = _make_query(alq_activo)
        self.assertIs(detalle_alquiler_controller._obtener_alquiler_o_error(db, 5), alq_activo)

        db.execute.return_value.scalar.return_value = Decimal("120000")
        detalle_alquiler_controller._recalcular_precio_alquiler(db, 5)

        det_in = DetalleAlquilerCreate(
            id_alquiler=5, id_producto=1, cantidad_productos=2, precio_conjunto=Decimal("20000")
        )
        db.execute.return_value.first.return_value = MockRow({"id_detalle_alquiler": 10, "id_alquiler": 5})
        det_creado = detalle_alquiler_controller.crear_detalle_alquiler(db, det_in, self.actor)
        self.assertEqual(det_creado["id_detalle_alquiler"], 10)

        db.query.side_effect = [_make_query(None)]
        self.assertIsNone(
            detalle_alquiler_controller.actualizar_detalle_alquiler(
                db, 99, DetalleAlquilerUpdate(cantidad_productos=3), self.actor
            )
        )
        det_obj = DetalleAlquiler(id_detalle_alquiler=10, id_alquiler=5, cantidad_productos=2)
        db.query.side_effect = [_make_query(det_obj), _make_query(alq_activo)]
        det_upd = detalle_alquiler_controller.actualizar_detalle_alquiler(
            db, 10, DetalleAlquilerUpdate(cantidad_productos=4), self.actor
        )
        self.assertEqual(det_upd["id_detalle_alquiler"], 10)

        # auditoria_controller
        db.execute.side_effect = [MagicMock(first=MagicMock(return_value=None))]
        self.assertIsNone(auditoria_controller.historial_alquiler(db, 999))
        db.execute.side_effect = [
            MagicMock(first=MagicMock(return_value=(1,))),
            [MockRow({"id_auditoria": 1, "tipo_operacion": "UPDATE"})],
        ]
        hist = auditoria_controller.historial_alquiler(db, 5)
        self.assertEqual(hist["total_eventos"], 1)


class TestRutasAuthProductosClientesUsuariosGastosDetalles(unittest.TestCase):
    def setUp(self):
        self.db_mock = MagicMock()
        app.dependency_overrides[get_db] = lambda: self.db_mock
        self.tok_admin = crear_access_token("1001", "admin")
        self.tok_fact = crear_access_token("1002", "encargado_facturacion")
        self.tok_log = crear_access_token("1003", "encargado_logistico")

    def tearDown(self):
        app.dependency_overrides.clear()

    def _hdr(self, token):
        return {"Authorization": f"Bearer {token}"}

    @patch("app.routes.auth_routes.login_usuario")
    def test_auth_login_rutas(self, mock_login):
        mock_login.return_value = {"logueado": True, "access_token": "tok"}
        st, body, _ = asyncio.run(_asgi_request("POST", "/api/sga/auth/login", json_body={
            "email_usuario": "admin@sga.local", "contrasena_usuario": "123456"
        }))
        self.assertEqual(st, 200)

        mock_login.return_value = None
        st, _, _ = asyncio.run(_asgi_request("POST", "/api/sga/auth/login", json_body={
            "email_usuario": "admin@sga.local", "contrasena_usuario": "mal"
        }))
        self.assertEqual(st, 401)

        mock_login.side_effect = ValueError("Falta identificador")
        st, _, _ = asyncio.run(_asgi_request("POST", "/api/sga/auth/login", json_body={
            "contrasena_usuario": "mal"
        }))
        self.assertEqual(st, 400)

        mock_login.side_effect = RuntimeError("Fallo interno")
        st, _, _ = asyncio.run(_asgi_request("POST", "/api/sga/auth/login", json_body={
            "email_usuario": "a@b.com", "contrasena_usuario": "mal"
        }))
        self.assertEqual(st, 500)

    @patch("app.routes.producto_routes.cambiar_estado_producto")
    @patch("app.routes.producto_routes.actualizar_producto")
    @patch("app.routes.producto_routes.obtener_producto")
    @patch("app.routes.producto_routes.obtener_productos")
    @patch("app.routes.producto_routes.crear_producto")
    def test_productos_rutas(self, m_crear, m_list, m_get, m_upd, m_est):
        m_crear.return_value = SimpleNamespace(id_producto=1, nombre_producto="Tabla", stock_total=10)
        st, _, _ = asyncio.run(_asgi_request(
            "POST", "/api/sga/productos", headers=self._hdr(self.tok_admin), json_body={
                "nombre_producto": "Tabla", "precio_base_producto": 5000, "stock_total": 10
            }
        ))
        self.assertEqual(st, 201)

        st_403, _, _ = asyncio.run(_asgi_request(
            "POST", "/api/sga/productos", headers=self._hdr(self.tok_fact),
            json_body={"nombre_producto": "T", "precio_base_producto": 100, "stock_total": 1}
        ))
        self.assertEqual(st_403, 403)

        m_list.return_value = []
        st, _, _ = asyncio.run(_asgi_request("GET", "/api/sga/productos", headers=self._hdr(self.tok_log)))
        self.assertEqual(st, 200)

        m_get.return_value = None
        st, _, _ = asyncio.run(_asgi_request("GET", "/api/sga/productos/99", headers=self._hdr(self.tok_log)))
        self.assertEqual(st, 404)

        m_upd.return_value = {"id_producto": 1}
        st, _, _ = asyncio.run(_asgi_request(
            "PATCH", "/api/sga/productos/1", headers=self._hdr(self.tok_admin),
            json_body={"nombre_producto": "Tabla Pro"}
        ))
        self.assertEqual(st, 200)

        m_est.side_effect = ValueError("Tiene stock alquilado")
        st, _, _ = asyncio.run(_asgi_request(
            "PATCH", "/api/sga/productos/1/estado", headers=self._hdr(self.tok_admin),
            json_body={"estado_registro": False}
        ))
        self.assertEqual(st, 400)

    @patch("app.routes.cliente_routes.cambiar_estado_cliente")
    @patch("app.routes.cliente_routes.actualizar_cliente")
    @patch("app.routes.cliente_routes.obtener_cliente")
    @patch("app.routes.cliente_routes.obtener_clientes")
    @patch("app.routes.cliente_routes.crear_cliente")
    def test_clientes_rutas(self, m_crear, m_list, m_get, m_upd, m_est):
        cli_ns = SimpleNamespace(
            id_usuario="9001", nombres_usuario="C", apellidos_usuario="R",
            telefono_usuario="300", email_usuario="c@r.com", estado_registro=True
        )
        m_crear.return_value = cli_ns
        st, _, _ = asyncio.run(_asgi_request("POST", "/api/sga/clientes", headers=self._hdr(self.tok_fact), json_body={
            "id_usuario": "9001", "nombres_usuario": "C", "apellidos_usuario": "R",
            "telefono_usuario": "300", "tipo_documento": "CC"
        }))
        self.assertEqual(st, 201)

        m_list.return_value = []
        st, _, _ = asyncio.run(_asgi_request("GET", "/api/sga/clientes", headers=self._hdr(self.tok_log)))
        self.assertEqual(st, 200)

        m_get.return_value = None
        st, _, _ = asyncio.run(_asgi_request("GET", "/api/sga/clientes/99", headers=self._hdr(self.tok_log)))
        self.assertEqual(st, 404)

        m_upd.return_value = cli_ns
        st, _, _ = asyncio.run(_asgi_request(
            "PATCH", "/api/sga/clientes/9001", headers=self._hdr(self.tok_fact),
            json_body={"nombres_usuario": "Carlos"}
        ))
        self.assertEqual(st, 200)

        m_est.return_value = cli_ns
        st, _, _ = asyncio.run(_asgi_request(
            "PATCH", "/api/sga/clientes/9001/estado", headers=self._hdr(self.tok_fact),
            json_body={"estado_registro": False}
        ))
        self.assertEqual(st, 200)

    @patch("app.routes.usuario_routes.cambiar_estado_usuario")
    @patch("app.routes.usuario_routes.actualizar_usuario")
    @patch("app.routes.usuario_routes.obtener_usuario")
    @patch("app.routes.usuario_routes.obtener_usuarios")
    @patch("app.routes.usuario_routes.crear_usuario")
    def test_usuarios_rutas(self, m_crear, m_list, m_get, m_upd, m_est):
        usr_ns = SimpleNamespace(
            id_usuario="2001", rol_usuario="encargado_logistico",
            nombres_usuario="L", apellidos_usuario="G",
            email_usuario="l@g.com", telefono_usuario="301", estado_registro=True
        )
        m_crear.return_value = usr_ns
        st, _, _ = asyncio.run(_asgi_request("POST", "/api/sga/usuarios", headers=self._hdr(self.tok_admin), json_body={
            "id_usuario": "2001", "rol_usuario": "encargado_logistico",
            "nombres_usuario": "L", "apellidos_usuario": "G",
            "telefono_usuario": "301", "contrasena_usuario": "Clave1234", "tipo_documento": "CC"
        }))
        self.assertEqual(st, 201)

        # Logístico sin ?rol=encargado_logistico recibe 403; con ese query recibe 200
        st, _, _ = asyncio.run(_asgi_request("GET", "/api/sga/usuarios", headers=self._hdr(self.tok_log)))
        self.assertEqual(st, 403)
        m_list.return_value = []
        st, _, _ = asyncio.run(_asgi_request(
            "GET", "/api/sga/usuarios", query_string="rol_usuario=encargado_logistico",
            headers=self._hdr(self.tok_log)
        ))
        self.assertEqual(st, 200)

        m_get.return_value = None
        st, _, _ = asyncio.run(_asgi_request("GET", "/api/sga/usuarios/999", headers=self._hdr(self.tok_admin)))
        self.assertEqual(st, 404)

        m_upd.return_value = usr_ns
        st, _, _ = asyncio.run(_asgi_request(
            "PATCH", "/api/sga/usuarios/2001", headers=self._hdr(self.tok_admin),
            json_body={"nombres_usuario": "Luis"}
        ))
        self.assertEqual(st, 200)

        m_est.return_value = usr_ns
        st, _, _ = asyncio.run(_asgi_request(
            "PATCH", "/api/sga/usuarios/2001/estado", headers=self._hdr(self.tok_admin),
            json_body={"estado_registro": False}
        ))
        self.assertEqual(st, 200)

    @patch("app.routes.gastos_routes.resumen_semanal_gastos")
    @patch("app.routes.gastos_routes.obtener_gastos")
    @patch("app.routes.gastos_routes.crear_gasto")
    @patch("app.routes.detalle_alquiler_routes.actualizar_detalle_alquiler")
    @patch("app.routes.detalle_alquiler_routes.obtener_detalle_alquiler")
    @patch("app.routes.detalle_alquiler_routes.crear_detalle_alquiler")
    def test_gastos_y_detalle_rutas_y_raiz(
        self, m_det_c, m_det_g, m_det_u, m_gas_c, m_gas_g, m_gas_r
    ):
        st_root, body_root, _ = asyncio.run(_asgi_request("GET", "/"))
        self.assertEqual(st_root, 200)
        self.assertTrue(body_root["status"])

        m_gas_c.return_value = {"id_logistica_alquiler": 1}
        st, _, _ = asyncio.run(_asgi_request("POST", "/api/sga/gastos", headers=self._hdr(self.tok_log), json_body={
            "ids_alquiler": [1], "valor_gasto_logistico": 25000, "descripcion_gasto_logistico": "Peaje"
        }))
        self.assertEqual(st, 201)

        m_gas_g.return_value = []
        st, _, _ = asyncio.run(_asgi_request("GET", "/api/sga/gastos", headers=self._hdr(self.tok_log)))
        self.assertEqual(st, 200)

        m_gas_r.return_value = []
        st, _, _ = asyncio.run(_asgi_request(
            "GET", "/api/sga/gastos/resumen-semanal", headers=self._hdr(self.tok_fact)
        ))
        self.assertEqual(st, 200)
        st_403, _, _ = asyncio.run(_asgi_request(
            "GET", "/api/sga/gastos/resumen-semanal", headers=self._hdr(self.tok_log)
        ))
        self.assertEqual(st_403, 403)

        m_det_c.return_value = {"id_detalle_alquiler": 10}
        st, _, _ = asyncio.run(_asgi_request(
            "POST", "/api/sga/detalle-alquiler", headers=self._hdr(self.tok_fact),
            json_body={"id_alquiler": 1, "id_producto": 1, "cantidad_productos": 2, "precio_conjunto": 10000}
        ))
        self.assertEqual(st, 201)

        m_det_g.return_value = None
        st, _, _ = asyncio.run(_asgi_request(
            "GET", "/api/sga/detalle-alquiler/99", headers=self._hdr(self.tok_log)
        ))
        self.assertEqual(st, 404)

        m_det_u.return_value = {"id_detalle_alquiler": 10}
        st, _, _ = asyncio.run(_asgi_request(
            "PATCH", "/api/sga/detalle-alquiler/10", headers=self._hdr(self.tok_fact),
            json_body={"cantidad_productos": 5}
        ))
        self.assertEqual(st, 200)
