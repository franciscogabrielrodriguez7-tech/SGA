import { useEffect, useState } from "react";

import { gastosApi } from "../../api/gastos";
import { alquileresApi } from "../../api/alquileres";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type { MovimientoLogistico, ResumenSemanal } from "../../interfaces/Logistica";
import type { Alquiler } from "../../interfaces/Alquiler";
import { toaster } from "../../components/ui/toaster";
import { ADMIN_O_FACTURACION, tienePermiso } from "../../utils/permisos";

import { CrearGastoSection } from "../../components/gastosComponents/CrearGastoSection";
import { ListaGastos } from "../../components/gastosComponents/ListaGastos";

export function Gastos() {
  const { usuario } = useAuth();
  // GET /gastos/resumen-semanal es ADMIN_O_FACTURACION en el backend
  // (app/routes/gastos_routes.py); registrar/listar gastos es
  // STAFF_INTERNO (los 3 roles). El resumen se pide aparte para que un
  // 403 ahí no tumbe la lista de gastos, que sí puede ver logística.
  const puedeVerResumen = tienePermiso(usuario?.rol_usuario, ADMIN_O_FACTURACION);

  const [gastos, setGastos] = useState<MovimientoLogistico[]>([]);
  const [resumen, setResumen] = useState<ResumenSemanal[]>([]);
  const [alquileres, setAlquileres] = useState<Alquiler[]>([]);
  const [cargando, setCargando] = useState(true);

  // Un mismo gasto (mismo viaje/valor/fecha) puede corresponder a
  // varios alquileres a la vez (ej. una entrega que despachó
  // productos de 2 alquileres en el mismo viaje): por eso es una
  // selección múltiple, no un solo ID. El backend registra una fila
  // de logistica_alquiler por cada alquiler elegido, todas con los
  // mismos datos del gasto — la tabla y su relación 1 fila = 1
  // alquiler no cambian.
  const [idsAlquilerSeleccionados, setIdsAlquilerSeleccionados] = useState<number[]>([]);
  const [busquedaAlquiler, setBusquedaAlquiler] = useState("");
  const [esRecogida, setEsRecogida] = useState(false);
  const [valor, setValor] = useState(0);
  const [descripcion, setDescripcion] = useState("");
  const [creando, setCreando] = useState(false);

  const cargar = () => {
    setCargando(true);

    gastosApi
      .listar()
      .then(setGastos)
      .catch((error) => {
        const mensaje = error instanceof ApiError ? error.message : "Error al cargar gastos";
        toaster.create({ title: "Error", description: mensaje, type: "error" });
      })
      .finally(() => setCargando(false));

    alquileresApi.listar().then(setAlquileres).catch(() => {
      // Silencioso: si falla, el selector de alquileres queda vacío
      // pero el resto de la pantalla (lista de gastos) sigue usable.
    });

    if (puedeVerResumen) {
      gastosApi
        .resumenSemanal()
        .then(setResumen)
        .catch((error) => {
          const mensaje =
            error instanceof ApiError ? error.message : "Error al cargar el resumen semanal";
          toaster.create({ title: "Error", description: mensaje, type: "error" });
        });
    }
  };

  useEffect(cargar, []);

  const alquileresFiltrados = alquileres.filter((a) => {
    if (!busquedaAlquiler) return true;
    const termino = busquedaAlquiler.toLowerCase();
    return (
      String(a.id_alquiler).includes(termino) ||
      a.nombres_cliente?.toLowerCase().includes(termino) ||
      a.apellidos_cliente?.toLowerCase().includes(termino)
    );
  });

  const alternarAlquiler = (id: number) => {
    setIdsAlquilerSeleccionados((actuales) =>
      actuales.includes(id) ? actuales.filter((x) => x !== id) : [...actuales, id],
    );
  };

  const manejarCrear = async () => {
    if (idsAlquilerSeleccionados.length === 0 || valor <= 0) {
      toaster.create({
        title: "Datos incompletos",
        description: "Selecciona al menos un alquiler e indica un valor mayor a 0.",
        type: "warning",
      });
      return;
    }

    setCreando(true);

    try {
      await gastosApi.crear({
        ids_alquiler: idsAlquilerSeleccionados,
        es_recogida: esRecogida,
        valor_gasto_logistico: valor,
        descripcion_gasto_logistico: descripcion || undefined,
      });

      toaster.create({
        title: "Gasto registrado",
        description: `Registrado en ${idsAlquilerSeleccionados.length} alquiler(es).`,
        type: "success",
      });

      setIdsAlquilerSeleccionados([]);
      setValor(0);
      setDescripcion("");

      cargar();
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : "No se pudo registrar el gasto";
      toaster.create({ title: "Error", description: mensaje, type: "error" });
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="stack gap-8">
      <h1 className="heading-xl">Gastos logísticos</h1>

      <CrearGastoSection
        busquedaAlquiler={busquedaAlquiler}
        setBusquedaAlquiler={setBusquedaAlquiler}
        alquileresFiltrados={alquileresFiltrados}
        idsAlquilerSeleccionados={idsAlquilerSeleccionados}
        alternarAlquiler={alternarAlquiler}
        valor={valor} setValor={setValor}
        descripcion={descripcion} setDescripcion={setDescripcion}
        esRecogida={esRecogida} setEsRecogida={setEsRecogida}
        creando={creando} manejarCrear={manejarCrear}
      />

      <ListaGastos
        puedeVerResumen={puedeVerResumen}
        resumen={resumen}
        gastos={gastos}
        cargando={cargando}
      />
    </div>
  );
}
