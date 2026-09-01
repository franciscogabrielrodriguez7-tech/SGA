"""
scheduler.py
------------
NUEVO. Antes no existía ningún mecanismo automático que pasara un
alquiler de 'activo' a 'vencido' cuando se cumplía la fecha — solo
pasaba si alguien consultaba ese alquiler (y ni siquiera entonces,
porque antes tampoco existía la reconciliación en lectura).

Ahora hay DOS mecanismos, tal como pide el roadmap (sección 15), para
que el sistema no dependa exclusivamente de uno:

1. Este scheduler (APScheduler), que corre todos los días a las 00:00
   America/Bogota y llama a
   alquiler_controller.verificar_y_actualizar_vencidos().
2. Esa MISMA función también se llama al inicio de
   obtener_alquiler/obtener_alquileres/buscar_alquileres/etc. (ver
   alquiler_controller.py), para que una consulta nunca muestre un
   alquiler 'activo' cuyo vencimiento ya pasó, incluso si el
   scheduler diario todavía no ha corrido.
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.config.database import SessionLocal
from app.controllers.alquiler_controller import verificar_y_actualizar_vencidos

_scheduler = BackgroundScheduler(timezone="America/Bogota")


def _job_actualizar_vencidos():

    db = SessionLocal()

    try:
        cantidad = verificar_y_actualizar_vencidos(db)
        print(f"[scheduler] Alquileres pasados a 'vencido': {cantidad}")

    finally:
        db.close()


def iniciar_scheduler():

    _scheduler.add_job(
        _job_actualizar_vencidos,
        trigger=CronTrigger(hour=0, minute=0, timezone="America/Bogota"),
        id="actualizar_vencidos_diario",
        replace_existing=True,
    )

    _scheduler.start()


def detener_scheduler():

    if _scheduler.running:
        _scheduler.shutdown(wait=False)
