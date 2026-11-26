import asyncio
import json
import os
import unittest
from datetime import date, timedelta
from decimal import Decimal
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
from app.controllers import alquiler_controller
from app.models.alquiler import Alquiler
from app.models.usuario import Usuario
from app.schemas.alquiler_schema import AlquilerCreate, AlquilerUpdate, DetalleAlquilerInline
from app.schemas.logistica_alquiler_schema import EntregaCreate, RecogidaCreate
from app.utils.auth_dependency import UsuarioActual
from app.utils.jwt_utils import crear_access_token
from app.utils.tiempo import fecha_actual_bogota


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


def _alquiler_dummy(estado="pendiente", dias=7, inicio=None):
    hoy = fecha_actual_bogota()
    alq = Alquiler(
        id_alquiler=1,
        id_usuario_creador="1001",
        id_usuario_cliente="9001",
        estado_alquiler=estado,
        barrio="Centro",
        direccion="Cra 1 # 2-3",
        deposito=Decimal("50000"),
        precio_alquiler=Decimal("120000"),
        fecha_inicio=inicio or hoy,
        tiempo_alquiler_dias=dias,
        se_lleva=True,
        se_recoge=True,
        estado_registro=True,
    )
    alq.cliente = Usuario(id_usuario="9001", nombres_usuario="Juan", apellidos_usuario="Perez")
    alq.creador = Usuario(id_usuario="1001", nombres_usuario="Admin", apellidos_usuario="Uno")
    return alq


class TestAlquilerControllerCicloDeVida(unittest.TestCase):
    def setUp(self):
        self.actor = UsuarioActual("1001", "admin")

    def test_crear_obtener_listar_y_filtros(self):
        db = MagicMock()
        hoy = fecha_actual_bogota()
        datos = AlquilerCreate(
            id_usuario_cliente="9001",
            barrio="Norte",
            direccion="Calle 10",
            deposito=Decimal("0"),
            precio_alquiler=Decimal("90000"),
            fecha_inicio=hoy,
            tiempo_alquiler_dias=7,
            se_lleva=True,
            se_recoge=False,
            detalles=[DetalleAlquilerInline(id_producto=1, cantidad_productos=3, precio_conjunto=Decimal("90000"))],
        )

        # Unidad incompatible (producto exige MES pero se envían 7 días)
        db.query.return_value = _make_query(all_val=[("MES",)])
        with self.assertRaises(ValueError):
            alquiler_controller.crear_alquiler(db, datos, self.actor)

        # Creación exitosa + obtener_alquiler
        alq = _alquiler_dummy("pendiente", dias=7, inicio=hoy)
        db.query.side_effect = [
            _make_query(all_val=[("SEMANA",)]),
            _make_query(first_val=alq),
            _make_query(all_val=[]),
        ]
        creado = alquiler_controller.crear_alquiler(db, datos, self.actor)
        self.assertEqual(creado["id_alquiler"], 1)

        # obtener_alquileres, buscar_alquileres, proximos_vencer, pendientes_entrega
        db.query.side_effect = None
        db.query.return_value = _make_query(all_val=[alq])
        self.assertEqual(len(alquiler_controller.obtener_alquileres(db, "pendiente", "9001")), 1)
        self.assertEqual(len(alquiler_controller.buscar_alquileres(db, "Juan", "Centro", 1)), 1)
        self.assertEqual(len(alquiler_controller.alquileres_proximos_a_vencer(db, 2)), 1)
        self.assertEqual(len(alquiler_controller.alquileres_pendientes_entrega(db, False)), 1)
        self.assertEqual(len(alquiler_controller.alquileres_pendientes_entrega(db, True)), 1)

    def test_actualizar_alquiler_y_matriz_estados(self):
        db = MagicMock()
        hoy = fecha_actual_bogota()

        db.query.return_value = _make_query(first_val=None)
        self.assertIsNone(alquiler_controller.actualizar_alquiler(db, 99, AlquilerUpdate(), self.actor))

        # Campo no editable en estado 'activo' (barrio no permitido)
        alq_act = _alquiler_dummy("activo", dias=14, inicio=hoy)
        db.query.return_value = _make_query(first_val=alq_act)
        with self.assertRaises(ValueError):
            alquiler_controller.actualizar_alquiler(db, 1, AlquilerUpdate(barrio="Sur"), self.actor)

        # fecha_inicio anterior a hoy rechazada en pendiente
        alq_pend = _alquiler_dummy("pendiente", dias=7, inicio=hoy)
        db.query.return_value = _make_query(first_val=alq_pend)
        with self.assertRaises(ValueError):
            alquiler_controller.actualizar_alquiler(
                db, 1, AlquilerUpdate(fecha_inicio=hoy - timedelta(days=1)), self.actor
            )

        # Reducción de tiempo que deja vencimiento en el pasado rechazada
        alq_act_pasado = _alquiler_dummy("activo", dias=30, inicio=hoy - timedelta(days=10))
        db.query.side_effect = [_make_query(first_val=alq_act_pasado), _make_query(all_val=[("DIA",)])]
        with self.assertRaises(ValueError):
            alquiler_controller.actualizar_alquiler(db, 1, AlquilerUpdate(tiempo_alquiler_dias=5), self.actor)

        # Aumento de tiempo en estado vencido -> reactivación a activo
        alq_venc = _alquiler_dummy("vencido", dias=7, inicio=hoy - timedelta(days=10))
        db.query.side_effect = [
            _make_query(first_val=alq_venc),
            _make_query(all_val=[("DIA",)]),
            _make_query(first_val=alq_venc),
            _make_query(all_val=[]),
        ]
        res = alquiler_controller.actualizar_alquiler(
            db, 1, AlquilerUpdate(tiempo_alquiler_dias=20, precio_alquiler=Decimal("150000")), self.actor
        )
        self.assertEqual(res["estado_alquiler"], "activo")

    def test_cambiar_estado_cancelar_renovar_entrega_recogida(self):
        db = MagicMock()
        hoy = fecha_actual_bogota()

        # cambiar_estado_alquiler
        db.query.return_value = _make_query(first_val=None)
        self.assertIsNone(alquiler_controller.cambiar_estado_alquiler(db, 99, "activo", self.actor))

        alq_pend = _alquiler_dummy("pendiente", dias=7, inicio=hoy)
        db.query.return_value = _make_query(first_val=alq_pend)
        with self.assertRaises(ValueError):
            alquiler_controller.cambiar_estado_alquiler(db, 1, "pendiente", self.actor)
        with self.assertRaises(ValueError):
            alquiler_controller.cambiar_estado_alquiler(db, 1, "terminado", self.actor)

        db.query.side_effect = [_make_query(alq_pend), _make_query(alq_pend), _make_query(all_val=[])]
        res_cancel = alquiler_controller.cancelar_alquiler(db, 1, self.actor)
        self.assertEqual(res_cancel["estado_alquiler"], "cancelado")

        # renovar_alquiler
        db.query.side_effect = [_make_query(alq_pend)]
        with self.assertRaises(ValueError):
            alquiler_controller.renovar_alquiler(db, 1, 7, self.actor)

        alq_act = _alquiler_dummy("activo", dias=7, inicio=hoy)
        db.query.side_effect = [
            _make_query(alq_act), _make_query(all_val=[("DIA",)]),
            _make_query(alq_act), _make_query(all_val=[])
        ]
        res_ren = alquiler_controller.renovar_alquiler(db, 1, 7, self.actor, precio_alquiler=Decimal("180000"))
        self.assertEqual(res_ren["tiempo_alquiler_dias"], 14)

        # registrar_entrega
        alq_term = _alquiler_dummy("terminado")
        db.query.side_effect = [_make_query(alq_term)]
        with self.assertRaises(ValueError):
            alquiler_controller.registrar_entrega(
                db, 1, EntregaCreate(observaciones_logistica_alquiler="obs"), self.actor
            )

        alq_p2 = _alquiler_dummy("pendiente")
        db.query.side_effect = [_make_query(alq_p2)]
        res_ent = alquiler_controller.registrar_entrega(
            db, 1, EntregaCreate(valor_gasto_logistico=Decimal("15000")), self.actor
        )
        self.assertEqual(res_ent["tipo_movimiento"], "ENTREGA")
        self.assertEqual(alq_p2.estado_alquiler, "activo")

        # registrar_recogida: sin entrega previa vs con entrega previa
        alq_act2 = _alquiler_dummy("activo")
        db.query.side_effect = [_make_query(alq_act2), _make_query(None)]
        with self.assertRaises(ValueError):
            alquiler_controller.registrar_recogida(db, 1, RecogidaCreate(), self.actor)

        db.query.side_effect = [_make_query(alq_act2), _make_query(MagicMock())]
        res_rec = alquiler_controller.registrar_recogida(db, 1, RecogidaCreate(), self.actor)
        self.assertEqual(res_rec["tipo_movimiento"], "RECOGIDA")
        self.assertEqual(alq_act2.estado_alquiler, "recogido")

        # DBAPIError en entrega (primer commit es de verificar_y_actualizar_vencidos)
        db.query.side_effect = [_make_query(_alquiler_dummy("pendiente"))]
        db.commit.side_effect = [None, DBAPIError("stmt", {}, Exception("Sin stock"))]
        with self.assertRaises(ValueError):
            alquiler_controller.registrar_entrega(db, 1, EntregaCreate(), self.actor)


class TestAlquilerRutasCompletas(unittest.TestCase):
    def setUp(self):
        self.db_mock = MagicMock()
        app.dependency_overrides[get_db] = lambda: self.db_mock
        self.tok_fact = crear_access_token("1002", "encargado_facturacion")
        self.tok_log = crear_access_token("1003", "encargado_logistico")

    def tearDown(self):
        app.dependency_overrides.clear()

    def _hdr(self, token):
        return {"Authorization": f"Bearer {token}"}

    @patch("app.routes.alquiler_routes.registrar_recogida")
    @patch("app.routes.alquiler_routes.registrar_entrega")
    @patch("app.routes.alquiler_routes.renovar_alquiler")
    @patch("app.routes.alquiler_routes.historial_alquiler")
    @patch("app.routes.alquiler_routes.cancelar_alquiler")
    @patch("app.routes.alquiler_routes.actualizar_alquiler")
    @patch("app.routes.alquiler_routes.obtener_alquiler")
    @patch("app.routes.alquiler_routes.obtener_alquileres")
    @patch("app.routes.alquiler_routes.alquileres_pendientes_entrega")
    @patch("app.routes.alquiler_routes.alquileres_proximos_a_vencer")
    @patch("app.routes.alquiler_routes.buscar_alquileres")
    @patch("app.routes.alquiler_routes.crear_alquiler")
    def test_alquiler_endpoints_principales(
        self, m_crear, m_bus, m_prox, m_pend, m_list, m_get, m_upd, m_can, m_hist, m_ren, m_ent, m_rec
    ):
        m_bus.return_value = []
        st, _, _ = asyncio.run(_asgi_request("GET", "/api/sga/alquileres/buscar", headers=self._hdr(self.tok_log)))
        self.assertEqual(st, 200)

        m_prox.return_value = []
        st, _, _ = asyncio.run(
            _asgi_request("GET", "/api/sga/alquileres/proximos-vencer", headers=self._hdr(self.tok_log))
        )
        self.assertEqual(st, 200)

        m_pend.return_value = []
        st, _, _ = asyncio.run(
            _asgi_request("GET", "/api/sga/alquileres/pendientes-entrega", headers=self._hdr(self.tok_log))
        )
        self.assertEqual(st, 200)

        m_crear.return_value = {"id_alquiler": 1}
        st, _, _ = asyncio.run(_asgi_request(
            "POST", "/api/sga/alquileres", headers=self._hdr(self.tok_fact), json_body={
                "id_usuario_cliente": "9001", "barrio": "Norte", "direccion": "Cll 1",
                "deposito": 0, "precio_alquiler": 50000,
                "fecha_inicio": date.today().isoformat(), "tiempo_alquiler_dias": 7,
                "detalles": [{"id_producto": 1, "cantidad_productos": 1, "precio_conjunto": 50000}],
            }
        ))
        self.assertEqual(st, 201)

        m_list.return_value = []
        st, _, _ = asyncio.run(_asgi_request("GET", "/api/sga/alquileres", headers=self._hdr(self.tok_log)))
        self.assertEqual(st, 200)

        m_get.return_value = None
        st, _, _ = asyncio.run(_asgi_request("GET", "/api/sga/alquileres/99", headers=self._hdr(self.tok_log)))
        self.assertEqual(st, 404)

        m_upd.return_value = {"id_alquiler": 1}
        st, _, _ = asyncio.run(_asgi_request(
            "PATCH", "/api/sga/alquileres/1", headers=self._hdr(self.tok_fact), json_body={"barrio": "Sur"}
        ))
        self.assertEqual(st, 200)

        m_can.return_value = {"id_alquiler": 1, "estado_alquiler": "cancelado"}
        st, _, _ = asyncio.run(_asgi_request("DELETE", "/api/sga/alquileres/1", headers=self._hdr(self.tok_fact)))
        self.assertEqual(st, 200)

        m_hist.return_value = {"id_alquiler": 1, "total_eventos": 0, "eventos": []}
        st, _, _ = asyncio.run(
            _asgi_request("GET", "/api/sga/alquileres/1/historial", headers=self._hdr(self.tok_fact))
        )
        self.assertEqual(st, 200)

        m_ren.return_value = {"id_alquiler": 1, "tiempo_alquiler_dias": 14}
        st, _, _ = asyncio.run(_asgi_request(
            "POST", "/api/sga/alquileres/1/renovaciones", headers=self._hdr(self.tok_fact), json_body={"dias": 7}
        ))
        self.assertEqual(st, 200)

        m_ent.return_value = {"id_logistica_alquiler": 10, "id_alquiler": 1, "tipo_movimiento": "ENTREGA"}
        st, _, _ = asyncio.run(_asgi_request(
            "POST", "/api/sga/alquileres/1/entregas", headers=self._hdr(self.tok_log), json_body={}
        ))
        self.assertEqual(st, 201)

        m_rec.return_value = {"id_logistica_alquiler": 11, "id_alquiler": 1, "tipo_movimiento": "RECOGIDA"}
        st, _, _ = asyncio.run(_asgi_request(
            "POST", "/api/sga/alquileres/1/recogidas", headers=self._hdr(self.tok_log), json_body={}
        ))
        self.assertEqual(st, 201)
