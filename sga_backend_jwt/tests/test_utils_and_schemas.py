import os
import unittest
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

import dotenv
import jwt
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.exc import DBAPIError

# Configurar entorno ficticio antes de importar módulos de app
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
from app.models.producto import Producto
from app.schemas.alquiler_schema import AlquilerEstadoUpdate
from app.schemas.cliente_schema import ClienteCreate
from app.schemas.usuario_schema import UsuarioCreate, UsuarioUpdate
from app.utils import auth_dependency, db_errors, jwt_utils, response, scheduler, security, tiempo, unidades


class TestSecurityAndJWT(unittest.TestCase):
    def test_hashear_y_verificar_contrasena(self):
        clave = "ClaveTemporalPrueba2026!"
        hashed = security.hashear_contrasena(clave)
        self.assertNotEqual(clave, hashed)
        self.assertTrue(hashed.startswith("$2"))
        self.assertTrue(security.verificar_contrasena(clave, hashed))
        self.assertFalse(security.verificar_contrasena("otra_clave", hashed))
        self.assertFalse(security.verificar_contrasena(clave, ""))
        self.assertFalse(security.verificar_contrasena(clave, "no_es_bcrypt"))

    def test_jwt_valido_invalido_y_expirado(self):
        token = jwt_utils.crear_access_token("1001", "admin")
        payload = jwt_utils.decodificar_access_token(token)
        self.assertEqual(payload["sub"], "1001")
        self.assertEqual(payload["rol_usuario"], "admin")

        with self.assertRaises(jwt_utils.TokenInvalido):
            jwt_utils.decodificar_access_token("token.invalido.firmado")

        expirado = jwt.encode(
            {"sub": "1001", "rol_usuario": "admin", "exp": datetime(2020, 1, 1)},
            os.environ["JWT_SECRET_KEY"],
            algorithm="HS256",
        )
        with self.assertRaises(jwt_utils.TokenExpirado):
            jwt_utils.decodificar_access_token(expirado)

    def test_auth_dependency_errores_401(self):
        with self.assertRaises(HTTPException) as ctx_none:
            auth_dependency.get_current_user(credenciales=None)
        self.assertEqual(ctx_none.exception.status_code, 401)

        creds_invalido = MagicMock(credentials="invalido")
        with self.assertRaises(HTTPException) as ctx_inv:
            auth_dependency.get_current_user(credenciales=creds_invalido)
        self.assertEqual(ctx_inv.exception.status_code, 401)

        expirado = jwt.encode(
            {"sub": "1001", "rol_usuario": "admin", "exp": datetime(2020, 1, 1)},
            os.environ["JWT_SECRET_KEY"],
            algorithm="HS256",
        )
        creds_exp = MagicMock(credentials=expirado)
        with self.assertRaises(HTTPException) as ctx_exp:
            auth_dependency.get_current_user(credenciales=creds_exp)
        self.assertEqual(ctx_exp.exception.status_code, 401)


class TestTiempoYUnidades(unittest.TestCase):
    def test_calculos_fecha_y_enriquecer_temporal(self):
        hoy = tiempo.fecha_actual_bogota()
        self.assertEqual(tiempo.fecha_vencimiento(date(2026, 11, 1), 15), date(2026, 11, 15))
        self.assertEqual(
            tiempo.calcula_nueva_fecha_vencimiento_tras_reduccion(date(2026, 11, 1), 10),
            date(2026, 11, 10),
        )

        # Activo con inicio futuro y vencimiento futuro
        a_futuro = tiempo.enriquecer_temporal({
            "estado_alquiler": "activo",
            "fecha_inicio": (hoy + timedelta(days=2)).isoformat(),
            "fecha_vencimiento": (hoy + timedelta(days=5)).isoformat(),
        })
        self.assertTrue(a_futuro["inicio_pendiente"])
        self.assertEqual(a_futuro["dias_restantes"], 5)
        self.assertFalse(a_futuro["vence_hoy"])

        # Activo que vence hoy
        a_hoy = tiempo.enriquecer_temporal({
            "estado_alquiler": "activo",
            "fecha_inicio": hoy - timedelta(days=4),
            "fecha_vencimiento": hoy,
        })
        self.assertTrue(a_hoy["vence_hoy"])
        self.assertEqual(a_hoy["dias_restantes"], 0)

        # Activo ya vencido (antes de correr scheduler)
        a_venc = tiempo.enriquecer_temporal({
            "estado_alquiler": "activo",
            "fecha_inicio": hoy - timedelta(days=10),
            "fecha_vencimiento": hoy - timedelta(days=3),
        })
        self.assertEqual(a_venc["dias_vencido"], 3)

        # Estado vencido y pendiente
        v = tiempo.enriquecer_temporal({
            "estado_alquiler": "vencido",
            "fecha_inicio": hoy - timedelta(days=5),
            "fecha_vencimiento": hoy - timedelta(days=1),
        })
        self.assertEqual(v["dias_vencido"], 1)

        p = tiempo.enriquecer_temporal({
            "estado_alquiler": "pendiente",
            "fecha_inicio": hoy,
            "fecha_vencimiento": hoy + timedelta(days=6),
        })
        self.assertIsNone(p["dias_restantes"])
        self.assertIsNone(p["dias_vencido"])

    def test_unidades_validacion_y_jerarquia(self):
        self.assertEqual(unidades.unidad_mas_restrictiva([]), "DIA")
        self.assertEqual(unidades.unidad_mas_restrictiva(["DIA", "SEMANA"]), "SEMANA")
        self.assertEqual(unidades.unidad_mas_restrictiva(["DIA", "MES", "SEMANA"]), "MES")

        unidades.validar_tiempo_alquiler_para_productos(30, ["MES", "DIA"])
        unidades.validar_tiempo_alquiler_para_productos(14, ["SEMANA"])
        unidades.validar_tiempo_alquiler_para_productos(3, ["DIA"])

        with self.assertRaises(ValueError):
            unidades.validar_tiempo_alquiler_para_productos(15, ["MES"])

        with self.assertRaises(ValueError):
            unidades.validar_tiempo_alquiler_para_productos(10, ["SEMANA"])


class TestDbErrorsSchedulerResponseYDatabase(unittest.TestCase):
    def test_db_errors_extraccion(self):
        diag = MagicMock(message_primary="Stock insuficiente para el producto")
        orig = MagicMock(diag=diag)
        err = DBAPIError("stmt", {}, orig)
        self.assertTrue(db_errors.es_error_de_base_de_datos(err))
        self.assertEqual(db_errors.extraer_mensaje_negocio(err), "Stock insuficiente para el producto")

        orig_sin_diag = Exception("Error linea 1\nCONTEXT: detalle")
        err2 = DBAPIError("stmt", {}, orig_sin_diag)
        self.assertEqual(db_errors.extraer_mensaje_negocio(err2), "Error linea 1")

        self.assertEqual(db_errors.extraer_mensaje_negocio(RuntimeError("Fallo simple")), "Fallo simple")

    def test_scheduler_job_y_ciclo_vida(self):
        mock_session = MagicMock()
        with patch.object(scheduler, "SessionLocal", return_value=mock_session):
            scheduler._job_actualizar_vencidos()
        mock_session.execute.assert_called_once()
        mock_session.commit.assert_called_once()
        mock_session.close.assert_called_once()

        mock_session_err = MagicMock()
        mock_session_err.execute.side_effect = RuntimeError("DB caída")
        with patch.object(scheduler, "SessionLocal", return_value=mock_session_err):
            with self.assertRaises(RuntimeError):
                scheduler._job_actualizar_vencidos()
        mock_session_err.rollback.assert_called_once()
        mock_session_err.close.assert_called_once()

        with patch.object(scheduler, "_scheduler") as mock_sched:
            mock_sched.running = False
            scheduler.iniciar_scheduler()
            mock_sched.add_job.assert_called_once()
            mock_sched.start.assert_called_once()

            mock_sched.running = True
            scheduler.detener_scheduler()
            mock_sched.shutdown.assert_called_once_with(wait=False)

    def test_get_db_generador_cierra_sesion(self):
        mock_session = MagicMock()
        with patch.object(_db_module, "SessionLocal", return_value=mock_session):
            gen = _db_module.get_db()
            yielded = next(gen)
            self.assertIs(yielded, mock_session)
            with self.assertRaises(StopIteration):
                next(gen)
        mock_session.close.assert_called_once()

    def test_response_serializacion_tipos_y_propiedades(self):
        prod = Producto(
            id_producto=1,
            nombre_producto="Andamio",
            precio_base_producto=Decimal("15000.50"),
            precio_base_extra=Decimal("15000.50"),
            stock_total=20,
            stock_alquilado=5,
        )
        serializado = response.convertir_json({
            "producto": prod,
            "hora": time(10, 30, 0),
            "lista": (Decimal("10.5"), date(2026, 11, 25)),
        })
        self.assertEqual(serializado["producto"]["stock_disponible"], 15)
        self.assertEqual(serializado["producto"]["precio_base_producto"], 15000.5)
        self.assertEqual(serializado["hora"], "10:30:00")
        self.assertEqual(serializado["lista"], [10.5, "2026-11-25"])

    def test_schemas_validadores_rechazan_valores_invalidos(self):
        with self.assertRaises(ValidationError):
            AlquilerEstadoUpdate(estado_alquiler="invalido")

        with self.assertRaises(ValidationError):
            ClienteCreate(
                id_usuario="123",
                nombres_usuario="Juan",
                apellidos_usuario="Perez",
                telefono_usuario="3001112233",
                tipo_documento="PASAPORTE",
            )

        with self.assertRaises(ValidationError):
            UsuarioCreate(
                id_usuario="123",
                rol_usuario="cliente",
                nombres_usuario="Ana",
                apellidos_usuario="Lopez",
                telefono_usuario="3001112233",
                contrasena_usuario="clave1234",
                tipo_documento="CC",
            )

        with self.assertRaises(ValidationError):
            UsuarioCreate(
                id_usuario="123",
                rol_usuario="admin",
                nombres_usuario="Ana",
                apellidos_usuario="Lopez",
                telefono_usuario="3001112233",
                contrasena_usuario="clave1234",
                tipo_documento="PAS",
            )

        with self.assertRaises(ValidationError):
            UsuarioUpdate(rol_usuario="cliente")
