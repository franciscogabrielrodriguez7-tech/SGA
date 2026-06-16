from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import engine, get_db
from app.models import Base, Cliente, Despacho, Producto, CodigoRegistro, Usuario, Alquiler, DetalleAlquiler, GastoTransporte
from app.schemas import (
    GastoDiarioOut,
    ProductoSchema,
    CodigoCreate,
    UsuarioCreate,
    UsuarioLogin,
    AlquilerCreate,
    AlquilerClose,
    AlquilerOut,
    GastoTransporteCreate,
    GastoTransporteOut,
    DespachoCreate,
    DespachoOut,
    DespachoUpdateEstado
)
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError

# --- Configuración de seguridad ---
SECRET_KEY = "SGA$2026!Andamios#Gestión@ClaveSuperSegura123"
ALGORITHM = "HS256"

# --- Inicialización de la aplicación ---
app = FastAPI(
    title="SGA - Sistema de Gestión de Alquiler de andamios",
    description="Sistema de gestión de alquiler de andamios, Bogotá, Colombia",
    version="0.0.1"
)

# --- Creación de tablas en la BD ---
Base.metadata.create_all(bind=engine)

# --- Configuración de contraseñas ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Configuración de seguridad ---
oauth2_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id_usuario")
        rol: int = payload.get("rol")
        if user_id is None or rol is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return {"id_usuario": user_id, "rol": rol}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

def get_current_admin(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] != 1:
        raise HTTPException(status_code=403, detail="No autorizado")
    return current_user

def get_current_facturacion(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] != 2:
        raise HTTPException(status_code=403, detail="No autorizado")
    return current_user

def get_current_logistica(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] != 3:
        raise HTTPException(status_code=403, detail="No autorizado")
    return current_user

@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido al SGA - Sistema de Gestión de Alquiler de Andamios"}

# --- Endpoints públicos ---
@app.get("/productos")
def listar_productos(db: Session = Depends(get_db)):
    return db.query(Producto).all()

# --- Endpoints protegidos por rol ---
@app.post("/productos/admin")
def crear_producto_admin(
    producto: ProductoSchema,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
):
    nuevo_producto = Producto(**producto.dict(exclude_unset=True, exclude={"id_producto"}))
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return {"mensaje": f"Producto {nuevo_producto.nombre_producto} creado por admin"}

# --- Endpoints de registro ---
@app.post("/registro/codigo")
def generar_codigo(datos: CodigoCreate, db: Session = Depends(get_db)):
    codigo = CodigoRegistro(rol_id=datos.rol_id, fecha_expiracion=datetime.utcnow() + timedelta(hours=24))
    db.add(codigo)
    db.commit()
    db.refresh(codigo)
    return {"codigo": codigo.codigo, "expira": codigo.fecha_expiracion}

@app.post("/registro")
def registrar_usuario(datos: UsuarioCreate, db: Session = Depends(get_db)):
    codigo_registro = db.query(CodigoRegistro).filter(CodigoRegistro.codigo == datos.codigo).first()
    if not codigo_registro or codigo_registro.fecha_expiracion < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Código inválido o expirado")

    hashed_password = pwd_context.hash(datos.contrasena_usuario)
    nuevo_usuario = Usuario(
        email_usuario=datos.email_usuario,
        contrasena_usuario=hashed_password,
        id_rol=codigo_registro.rol_id
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return {"mensaje": "Usuario registrado exitosamente"}

# --- Endpoint de login ---
@app.get("/login")
def login(datos: UsuarioLogin, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email_usuario == datos.email_usuario).first()
    if not usuario or not pwd_context.verify(datos.contrasena_usuario, usuario.contrasena_usuario):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token_data = {"id_usuario": usuario.id_usuario, "rol": usuario.id_rol}
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}

# --- Endpoints de alquiler (rol 2: facturación) ---
@app.post("/alquileres/crear", response_model=AlquilerOut)
def crear_alquiler(
    datos: AlquilerCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_facturacion)
):
    # 1. Verificar o crear cliente
    cliente_id = datos.id_cliente
    cliente = None

    if cliente_id:
        cliente = db.query(Cliente).filter(Cliente.id_cliente == cliente_id).first()
        if not cliente:
            if datos.cliente:
                # Crear cliente con los datos enviados
                nuevo_cliente = Cliente(
                    nombre_cliente=datos.cliente.nombre_cliente,
                    telefono_cliente=datos.cliente.telefono_cliente
                )
                db.add(nuevo_cliente)
                db.commit()
                db.refresh(nuevo_cliente)
                cliente_id = nuevo_cliente.id_cliente
            else:
                raise HTTPException(status_code=400, detail="Cliente no existe y no se enviaron datos para crearlo")
    else:
        if datos.cliente:
            nuevo_cliente = Cliente(
                nombre_cliente=datos.cliente.nombre_cliente,
                telefono_cliente=datos.cliente.telefono_cliente
            )
            db.add(nuevo_cliente)
            db.commit()
            db.refresh(nuevo_cliente)
            cliente_id = nuevo_cliente.id_cliente
        else:
            raise HTTPException(status_code=400, detail="Debe enviar id_cliente o datos del cliente")

    # 2. Crear alquiler
    nuevo_alquiler = Alquiler(
        id_cliente=cliente_id,
        id_usuario=current_user["id_usuario"],
        barrio=datos.barrio,
        direccion=datos.direccion,
        deposito=datos.deposito,
        estado_alquiler="Activo"
    )
    db.add(nuevo_alquiler)
    db.commit()
    db.refresh(nuevo_alquiler)

    # 3. Crear detalles
    for item in datos.productos:
        producto = db.query(Producto).filter(Producto.id_producto == item.id_producto).first()
        if not producto or producto.stock_disponible < item.cantidad_productos:
            raise HTTPException(status_code=400, detail=f"Producto {item.id_producto} no disponible o stock insuficiente")
        producto.stock_disponible -= item.cantidad_productos
        detalle = DetalleAlquiler(
            id_alquiler=nuevo_alquiler.id_alquiler,
            id_producto=item.id_producto,
            cantidad_productos=item.cantidad_productos,
            precio_unitario=producto.precio_base
        )
        db.add(detalle)

    db.commit()
    db.refresh(nuevo_alquiler)
    return nuevo_alquiler



@app.post("/alquileres/cerrar")
def cerrar_alquiler(
    datos: AlquilerClose,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_facturacion)
):
    alquiler = db.query(Alquiler).filter(Alquiler.id_alquiler == datos.id_alquiler).first()
    if not alquiler or alquiler.fecha_devolucion is not None:
        raise HTTPException(status_code=400, detail="Alquiler inválido o ya cerrado")

    alquiler.fecha_devolucion = datetime.utcnow()
    alquiler.estado_alquiler = "Cerrado"

    for detalle in alquiler.detalles:
        producto = db.query(Producto).filter(Producto.id_producto == detalle.id_producto).first()
        producto.stock_disponible += detalle.cantidad_productos

    db.commit()
    return {"mensaje": f"Alquiler {datos.id_alquiler} cerrado correctamente"}

@app.get("/alquileres", response_model=List[AlquilerOut])
def listar_alquileres(estado: Optional[str] = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    q = db.query(Alquiler)
    if estado:
        q = q.filter(Alquiler.estado_alquiler == estado)
    return q.all()

# 2. Crear despacho (asignar a un logistico)
@app.post("/logistica/despachos/crear", response_model=DespachoOut)
def crear_despacho(datos: DespachoCreate, db: Session = Depends(get_db), current_user=Depends(get_current_logistica)):
    alquiler = db.query(Alquiler).filter(Alquiler.id_alquiler == datos.id_alquiler).first()
    if not alquiler:
        raise HTTPException(status_code=404, detail="Alquiler no encontrado")
    despacho = Despacho(
        id_alquiler=datos.id_alquiler,
        id_usuario_logistico=current_user["id_usuario"],
        estado_despacho="Pendiente",
        observaciones=datos.observaciones
    )
    db.add(despacho)
    db.commit()
    db.refresh(despacho)
    # opcional: cambiar estado del alquiler a "Por entregar"
    alquiler.estado_alquiler = "Por entregar"
    db.commit()
    return despacho

# 3. Actualizar estado del despacho (entregado, en tránsito, recogido)
@app.post("/logistica/despachos/estado")
def actualizar_estado_despacho(datos: DespachoUpdateEstado, db: Session = Depends(get_db), current_user=Depends(get_current_logistica)):
    despacho = db.query(Despacho).filter(Despacho.id_despacho == datos.id_despacho).first()
    if not despacho:
        raise HTTPException(status_code=404, detail="Despacho no encontrado")
    despacho.estado_despacho = datos.nuevo_estado
    if datos.nuevo_estado == "Entregado":
        despacho.fecha_despacho = datos.fecha_evento or datetime.utcnow()
        despacho.alquiler.estado_alquiler = "Activo"
    if datos.nuevo_estado in ("Recogido", "Cerrado"):
        despacho.fecha_recepcion = datos.fecha_evento or datetime.utcnow()
        despacho.alquiler.estado_alquiler = "Cerrado"
    if datos.observaciones:
        despacho.observaciones = (despacho.observaciones or "") + f"\n{datos.observaciones}"
    db.commit()
    return {"mensaje": f"Despacho {datos.id_despacho} actualizado a {datos.nuevo_estado}"}

# 4. Agregar gasto de transporte (por día)
@app.post("/logistica/gastos", response_model=GastoTransporteOut)
def agregar_gasto_transporte(datos: GastoTransporteCreate, db: Session = Depends(get_db), current_user=Depends(get_current_logistica)):
    # validar que exista despacho o alquiler si se envía id
    if datos.id_despacho:
        if not db.query(Despacho).filter(Despacho.id_despacho == datos.id_despacho).first():
            raise HTTPException(status_code=404, detail="Despacho no encontrado")
    if datos.id_alquiler:
        if not db.query(Alquiler).filter(Alquiler.id_alquiler == datos.id_alquiler).first():
            raise HTTPException(status_code=404, detail="Alquiler no encontrado")
    gasto = GastoTransporte(
        id_despacho=datos.id_despacho,
        id_alquiler=datos.id_alquiler,
        fecha_gasto=datos.fecha_gasto or datetime.utcnow(),
        monto=datos.monto,
        descripcion=datos.descripcion
    )
    db.add(gasto)
    db.commit()
    db.refresh(gasto)
    return gasto

# 5. Consultar despachos y gastos (filtros por fecha, alquiler, estado)
@app.get("/logistica/despachos", response_model=list[DespachoOut])
def consultar_despachos(db: Session = Depends(get_db), estado: Optional[str] = None, current_user=Depends(get_current_logistica)):
    q = db.query(Despacho)
    if estado:
        q = q.filter(Despacho.estado_despacho == estado)
    return q.all()

@app.get("/admin/gastos", response_model=List[GastoDiarioOut])
def gastos_diarios(db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    resultados = (
        db.query(func.date(GastoTransporte.fecha_gasto).label("dia"),
                 func.sum(GastoTransporte.monto).label("total"))
        .group_by(func.date(GastoTransporte.fecha_gasto))
        .order_by(func.date(GastoTransporte.fecha_gasto))
        .all()
    )
    return [{"dia": str(r.dia), "total": float(r.total)} for r in resultados]
