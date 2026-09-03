import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ProductoSelect } from "../../components/productos/ProductoSelect";
import { InputMoneda } from "../../components/inputs/InputMoneda";
import { toaster } from "../../components/ui/toaster";

import { productosApi } from "../../api/productos";
import { usuariosApi } from "../../api/usuarios";
import { alquileresApi } from "../../api/alquileres";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

import type { DetalleProducto } from "../../interfaces/DetalleProducto";
import type { PrecioFinal } from "../../interfaces/PrecioFinal";
import type { Cliente } from "../../interfaces/Cliente";
import type { Producto } from "../../interfaces/Producto";

import { validarAlquiler } from "../../utils/validacionesAlquiler";
import { obtenerFechaActual } from "../../components/inputs/inputFecha";

// NOTA IMPORTANTE respecto al esqueleto original:
// - "clientes" ya NO se recibe como prop con datos mock: se busca en vivo
//   contra GET /api/sga/usuarios/{id_usuario} (RN-CLI-01: reutilizar
//   cliente existente o registrar uno nuevo).
// - "productos" ya NO es el arreglo estático de src/data/productos.ts:
//   se carga desde GET /api/sga/productos.
// - Reescrito además para no depender de Chakra UI: todo son elementos
//   HTML nativos con las clases de src/styles/components.css.

export function CrearAlquiler() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null);
  const [cargandoProductos, setCargandoProductos] = useState(true);

useEffect(() => {
  productosApi
    .listar()
    .then((productos) => {
      setProductos(productos);

      if (productos.length > 0) {
        setProductoSeleccionado(productos[0].id_producto);
      }
    })
    .catch((error) => {
      const mensaje =
        error instanceof ApiError
          ? error.message
          : "Error al cargar productos";

      toaster.create({
        title: "Error",
        description: mensaje,
        type: "error",
      });
    })
    .finally(() => setCargandoProductos(false));
}, []);

  const [detallesProducto, setDetallesProducto] = useState<DetalleProducto[]>([
    { productoId: null, cantidad: 1 },
  ]);

  const nombresRef = useRef<HTMLInputElement>(null);
  const apellidosRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const direccionRef = useRef<HTMLInputElement>(null);
  const barrioRef = useRef<HTMLInputElement>(null);
  const fechaInicioRef = useRef<HTMLInputElement>(null);
  const tiempoAlquilerRef = useRef<HTMLInputElement>(null);
  const depositoRef = useRef<HTMLInputElement>(null);

  const [seLleva, setSeLleva] = useState<boolean>(false);
  const [seRecoge, setSeRecoge] = useState<boolean>(false);
  const [direccion, setDireccion] = useState("");
  const [barrio, setBarrio] = useState("");
  const [fechaInicio, setFechaInicio] = useState<string>(obtenerFechaActual());
  const [tiempoAlquiler, setTiempoAlquiler] = useState<number>(1);
  const [deposito, setDeposito] = useState<number>(0);
  const [enviando, setEnviando] = useState(false);

  const [precioFinal, setPrecioFinal] = useState<PrecioFinal>({ valor: 0 });

  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [datosCliente, setDatosCliente] = useState<Cliente>({
    id_usuario: "",
    tipo_documento: "CC",
    nombres_usuario: "",
    apellidos_usuario: "",
    telefono_usuario: "",
  });
  const [estadoCliente, setEstadoCliente] = useState<
    "sin-verificar" | "encontrado" | "no-encontrado"
  >("sin-verificar");

  const buscarClientePorDocumento = async (documento: string) => {
    if (!documento) return;

    setBuscandoCliente(true);

    try {
      const encontrado = await usuariosApi.consultar(documento);

      setDatosCliente({
        id_usuario: encontrado.id_usuario,
        tipo_documento: encontrado.tipo_documento,
        nombres_usuario: encontrado.nombres_usuario,
        apellidos_usuario: encontrado.apellidos_usuario,
        telefono_usuario: encontrado.telefono_usuario,
      });
      setEstadoCliente("encontrado");
    } catch (error) {
      if (error instanceof ApiError && error.code === 404) {
        setEstadoCliente("no-encontrado");
        setDatosCliente((actuales) => ({
          ...actuales,
          id_usuario: documento,
          nombres_usuario: "",
          apellidos_usuario: "",
          telefono_usuario: "",
        }));
      } else {
        const mensaje =
          error instanceof ApiError ? error.message : "Error al buscar cliente";
        toaster.create({ title: "Error", description: mensaje, type: "error" });
      }
    } finally {
      setBuscandoCliente(false);
    }
  };

  const costoEntrega = seLleva ? 15000 : 0;
  const costoRecogida = seRecoge ? 15000 : 0;

  const totalProductos = detallesProducto.reduce((total, detalle) => {
    const productoActual = productos.find(
      (p) => p.id_producto === detalle.productoId,
    );
    const precioConjunto = productoActual
      ? productoActual.precio_base_producto * detalle.cantidad
      : 0;
    return total + precioConjunto;
  }, 0);

  const precioCalculado =
    totalProductos * tiempoAlquiler + costoEntrega + costoRecogida + deposito;

  useEffect(() => {
    setPrecioFinal({ valor: precioCalculado });
  }, [precioCalculado]);

  const agregarProducto = () => {
    if (detallesProducto.length >= productos.length) {
      toaster.create({
        title: "No se pueden agregar más productos",
        description:
          "Todos los productos disponibles ya han sido seleccionados.",
        type: "warning",
      });
      return;
    }

    setDetallesProducto((actuales) => [
      ...actuales,
      { productoId: null, cantidad: 1 },
    ]);
  };

  const eliminarProducto = (indiceAEliminar: number) => {
    if (detallesProducto.length === 1) {
      toaster.create({
        title: "No permitido",
        description: "Debe haber al menos un producto en el alquiler.",
        type: "warning",
      });
      return;
    }

    setDetallesProducto((actuales) =>
      actuales.filter((_, i) => i !== indiceAEliminar),
    );
  };

  const manejarCrearAlquiler = async () => {
    const error = validarAlquiler({
      cliente: datosCliente,
      detallesProducto,
      tiempoAlquiler,
      deposito,
    });

    if (error) {
      toaster.create({
        title: "Datos incompletos",
        description: error,
        type: "warning",
      });
      return;
    }

    if (!fechaInicio) {
      toaster.create({
        title: "Datos incompletos",
        description: "Debe indicar la fecha de inicio.",
        type: "warning",
      });
      return;
    }

    if (!usuario) {
      toaster.create({
        title: "Sesión requerida",
        description: "Debes iniciar sesión para crear un alquiler.",
        type: "error",
      });
      return;
    }

    setEnviando(true);

    try {
      if (estadoCliente === "no-encontrado") {
        await usuariosApi.crear({
          id_usuario: datosCliente.id_usuario,
          rol_usuario: "cliente",
          tipo_documento: datosCliente.tipo_documento,
          nombres_usuario: datosCliente.nombres_usuario,
          apellidos_usuario: datosCliente.apellidos_usuario,
          telefono_usuario: datosCliente.telefono_usuario,
        });
      }

      const alquilerCreado = await alquileresApi.crear({
        id_usuario_creador: usuario.id_usuario,
        id_usuario_cliente: datosCliente.id_usuario,
        barrio,
        direccion,
        deposito,
        precio_alquiler: precioFinal.valor,
        fecha_inicio: fechaInicio,
        tiempo_alquiler: tiempoAlquiler,
        se_lleva: seLleva,
        se_recoge: seRecoge,
        detalles: detallesProducto.map((d) => {
          const productoActual = productos.find(
            (p) => p.id_producto === d.productoId,
          );
          const precioConjunto = productoActual
            ? productoActual.precio_base_producto * d.cantidad
            : 0;

          return {
            id_producto: d.productoId as number,
            cantidad_productos: d.cantidad,
            precio_conjunto: precioConjunto,
          };
        }),
      });

      toaster.create({
        title: "Alquiler creado",
        description: `Alquiler #${alquilerCreado.id_alquiler} creado correctamente.`,
        type: "success",
      });

      navigate(`/alquileres/${alquilerCreado.id_alquiler}`);
    } catch (error) {
      // Aquí es donde, por ejemplo, se refleja "Operación denegada: El
      // usuario creador no se encuentra activo en el sistema." si el
      // backend lo rechaza (trg_validar_creador_activo), o cualquier otro
      // error de negocio (stock insuficiente, etc.) tal como lo devuelve
      // el backend.
      const mensaje =
        error instanceof ApiError
          ? error.message
          : "No se pudo crear el alquiler";

      toaster.create({
        title: "Error al crear el alquiler",
        description: mensaje,
        type: "error",
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="container-narrow">
      <div className="stack gap-2" style={{ marginBottom: 32 }}>
        <h1 className="heading-2xl">Crear alquiler</h1>
        <p className="text-muted">
          Registra la información necesaria para crear un nuevo alquiler.
        </p>
      </div>

      {/* Cliente */}
      <h2 className="heading-lg" style={{ marginBottom: 16 }}>
        Cliente
      </h2>

      <div className="card stack gap-4" style={{ marginBottom: 32 }}>
        <p className="text-bold">Datos del cliente</p>

        {estadoCliente === "encontrado" && (
          <p className="text-sm text-success">
            ✓ Cliente encontrado (ya registrado).
          </p>
        )}
        {estadoCliente === "no-encontrado" && (
          <p className="text-sm text-warning">
            Cliente no encontrado — se registrará como nuevo al crear el
            alquiler.
          </p>
        )}

        <div className="grid grid-cols-1 grid-cols-2-md">
          <div>
            <label className="field-label">Tipo de documento</label>
            <select
              className="input"
              value={datosCliente.tipo_documento}
              onChange={(e) =>
                setDatosCliente((actuales) => ({
                  ...actuales,
                  tipo_documento: e.target.value as Cliente["tipo_documento"],
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  nombresRef.current?.focus();
                }
              }}
            >
              <option value="CC">CC</option>
              <option value="CE">CE</option>
              <option value="NIT">NIT</option>
              <option value="PPT">PPT</option>
            </select>
          </div>

          <div>
            <label className="field-label">Número de documento</label>
            <input
              className="input"
              value={datosCliente.id_usuario}
              onChange={(e) => {
                const documento = e.target.value;
                setDatosCliente({
                  id_usuario: documento,
                  tipo_documento: "CC",
                  nombres_usuario: "",
                  apellidos_usuario: "",
                  telefono_usuario: "",
                });
                setEstadoCliente("sin-verificar");
              }}
              onBlur={() => buscarClientePorDocumento(datosCliente.id_usuario)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  buscarClientePorDocumento(datosCliente.id_usuario);
                }
              }}
              placeholder={
                buscandoCliente ? "Buscando..." : "Número de documento"
              }
            />
          </div>

          <div>
            <label className="field-label">Nombres</label>
            <input
              ref={nombresRef}
              className="input"
              value={datosCliente.nombres_usuario}
              placeholder="Nombres del cliente"
              onChange={(e) =>
                setDatosCliente((actuales) => ({
                  ...actuales,
                  nombres_usuario: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  apellidosRef.current?.focus();
                }
              }}
            />
          </div>

          <div>
            <label className="field-label">Apellidos</label>
            <input
              ref={apellidosRef}
              className="input"
              value={datosCliente.apellidos_usuario}
              placeholder="Apellidos del cliente"
              onChange={(e) =>
                setDatosCliente((actuales) => ({
                  ...actuales,
                  apellidos_usuario: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  telefonoRef.current?.focus();
                }
              }}
            />
          </div>

          <div>
            <label className="field-label">Teléfono</label>
            <input
              maxLength={10}
              ref={telefonoRef}
              className="input"
              value={datosCliente.telefono_usuario}
              placeholder="Teléfono del cliente"
              onChange={(e) =>
                setDatosCliente((actuales) => ({
                  ...actuales,
                  telefono_usuario: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  direccionRef.current?.focus();
                }
              }}
            />
          </div>
        </div>
      </div>
      {/* Alquiler */}
      <h2 className="heading-lg" style={{ marginBottom: 16 }}>
        Alquiler
      </h2>
      <div className="card stack gap-4" style={{ marginBottom: 32 }}>
        <div>
          <label className="field-label">Dirección</label>
          <input
            ref={direccionRef}
            className="input"
            placeholder="Dirección"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                barrioRef.current?.focus();
              }
            }}
          />
        </div>

        <div>
          <label className="field-label">Barrio</label>
          <input
            ref={barrioRef}
            className="input"
            placeholder="Barrio"
            value={barrio}
            onChange={(e) => setBarrio(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                fechaInicioRef.current?.focus();
              }
            }}
          />
        </div>

        <div className="grid grid-cols-1 grid-cols-2-md">
          <div>
            <label className="field-label">Fecha de inicio</label>
            <input
              className="input"
              type="date"
              ref={fechaInicioRef}
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  tiempoAlquilerRef.current?.focus();
                }
              }}
            />
          </div>

          <div>
            <label className="field-label">
              Tiempo de alquiler (en semanas)
            </label>
            <input
              ref={tiempoAlquilerRef}
              className="input"
              type="number"
              min={1}
              placeholder="Cantidad de semanas"
              onFocus={(e) => e.target.select()}
              value={tiempoAlquiler}
              onChange={(e) => setTiempoAlquiler(parseInt(e.target.value) || 1)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  depositoRef.current?.focus();
                }
              }}
            />

            <div style={{ marginTop: 16 }}>
              <label className="field-label">Depósito</label>
              <InputMoneda
                ref={depositoRef}
                value={deposito}
                onChange={setDeposito}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logística */}
      <h2 className="heading-lg" style={{ marginBottom: 16 }}>
        Logística
      </h2>
      <div className="hstack gap-8" style={{ marginBottom: 32 }}>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={seLleva}
            onChange={(e) => setSeLleva(e.target.checked)}
          />
          Se lleva
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={seRecoge}
            onChange={(e) => setSeRecoge(e.target.checked)}
          />
          Se recoge
        </label>
      </div>

      {/* Productos */}
      <h2 className="heading-lg" style={{ marginBottom: 16 }}>
        Productos
      </h2>

      {cargandoProductos && <p className="text-muted">Cargando productos...</p>}

      <div className="stack gap-4" style={{ marginBottom: 32 }}>
        {detallesProducto.map((detalle, indice) => {
          const productoActual = productos.find(
            (p) => p.id_producto === detalle.productoId,
          );
          const precioConjunto = productoActual
            ? productoActual.precio_base_producto * detalle.cantidad
            : 0;

          return (
            <div key={indice} className="card">
              <div className="grid grid-cols-1 grid-cols-3-md">
                <div>
                  <label className="field-label">Producto</label>
                  <ProductoSelect
                    productos={productos}
                    value={productoSeleccionado}
                    onProductoChange={setProductoSeleccionado}
                  />
                </div>

                <div>
                  <label className="field-label">Cantidad</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={detalle.cantidad}
                    onChange={(e) => {
                      const cantidad = Number(e.target.value);
                      setDetallesProducto((actuales) =>
                        actuales.map((d, i) =>
                          i === indice ? { ...d, cantidad } : d,
                        ),
                      );
                    }}
                  />
                </div>

                <div>
                  <label className="field-label">Precio conjunto</label>
                  <input
                    className="input"
                    value={`$${precioConjunto.toLocaleString("es-CO")}`}
                    readOnly
                  />
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ marginTop: 16 }}
                onClick={() => eliminarProducto(indice)}
              >
                Eliminar producto
              </button>
            </div>
          );
        })}

        <button
          type="button"
          className="btn btn-outline"
          style={{ alignSelf: "flex-start" }}
          onClick={agregarProducto}
        >
          + Agregar producto
        </button>
      </div>

      {/* Resumen */}
      <h2 className="heading-lg" style={{ marginBottom: 16 }}>
        Resumen del alquiler
      </h2>

      <div className="card stack gap-3" style={{ marginBottom: 32 }}>
        <div className="hstack justify-between">
          <span>Productos</span>
          <span>${totalProductos.toLocaleString("es-CO")}</span>
        </div>
        <div className="hstack justify-between">
          <span>Entrega</span>
          <span>${costoEntrega.toLocaleString("es-CO")}</span>
        </div>
        <div className="hstack justify-between">
          <span>Recogida</span>
          <span>${costoRecogida.toLocaleString("es-CO")}</span>
        </div>
        <div className="hstack justify-between">
          <span>Depósito</span>
          <span>${deposito.toLocaleString("es-CO")}</span>
        </div>
        <div className="hstack justify-between text-bold">
          <span>Precio calculado</span>
          <span>${precioCalculado.toLocaleString("es-CO")}</span>
        </div>

        <div style={{ paddingTop: 12 }}>
          <label className="field-label">Precio final del alquiler</label>
          <InputMoneda
            value={precioFinal.valor}
            onChange={(nuevoPrecio) => setPrecioFinal({ valor: nuevoPrecio })}
          />
        </div>
      </div>

      {/* Acciones */}
      <div className="hstack justify-end gap-3">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => navigate("/alquileres")}
        >
          Cancelar
        </button>

        <button
          type="button"
          className="btn btn-primary"
          disabled={enviando}
          onClick={manejarCrearAlquiler}
        >
          {enviando ? "Creando..." : "Crear alquiler"}
        </button>
      </div>
    </div>
  );
}
