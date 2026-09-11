"""
scheduler.py
------------
Job diario (00:05 America/Bogota) que transiciona 'activo' -> 'vencido'
cuando la fecha de vencimiento ya pasó. Es un mecanismo de RESPALDO:
la transición también se reconcilia en cada lectura de alquileres (ver
alquiler_controller.verificar_y_actualizar_vencidos), para que la
información nunca esté desactualizada aunque este scheduler todavía no
haya corrido ese día.
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.config.database import SessionLocal
from app.utils.tiempo import FECHA_VENCIMIENTO_SQL_SIN_ALIAS
from sqlalchemy import text

_scheduler = BackgroundScheduler(timezone="America/Bogota")


def _job_actualizar_vencidos():

    db = SessionLocal()

    try:
        db.execute(
            text(
                "UPDATE alquiler SET estado_alquiler = 'vencido' "
                "WHERE estado_alquiler = 'activo' "
                f"AND {FECHA_VENCIMIENTO_SQL_SIN_ALIAS} < CURRENT_DATE"
            )
        )
        db.commit()

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def iniciar_scheduler():

    if not _scheduler.running:

        _scheduler.add_job(
            _job_actualizar_vencidos,
            # [FIX] CronTrigger NO hereda la timezone del BackgroundScheduler
            # que lo contiene: por defecto usa UTC salvo que se le pase
            # timezone= explícitamente aquí. Sin este parámetro, el job
            # se ejecutaba a las 00:05 UTC (7:05 p.m. hora Bogotá del día
            # anterior) en vez de medianoche Bogotá, como está documentado.
            CronTrigger(hour=0, minute=5, timezone="America/Bogota"),
            id="actualizar_vencidos",
            replace_existing=True,
        )

        _scheduler.start()


def detener_scheduler():

    if _scheduler.running:
        _scheduler.shutdown(wait=False)
