import type { Alquiler } from "../../interfaces/Alquiler";
import { calcularEtiquetaVencimiento, claseBadgePorTono } from "../../utils/vencimiento";

interface DatosGeneralesSectionProps {
  alquiler: Alquiler;
}

export function DatosGeneralesSection({ alquiler }: DatosGeneralesSectionProps) {
  const etiquetaVencimiento = calcularEtiquetaVencimiento(alquiler);
  const canonPuro = alquiler.precio_alquiler - alquiler.deposito;

  return (
    <div className="card stack gap-0">

      {/* Bloque 1: Cliente y Ubicación */}
      <div className="data-group">
        <p className="data-group-title">👤 Cliente &amp; Dirección</p>
        <div className="data-grid">
          <div className="data-item data-grid-full">
            <span className="data-label">Cliente</span>
            <span className="data-value">
              {alquiler.nombres_cliente} {alquiler.apellidos_cliente}
            </span>
          </div>
          <div className="data-item">
            <span className="data-label">Documento</span>
            <span className="data-value">{alquiler.id_usuario_cliente}</span>
          </div>
          <div className="data-item">
            <span className="data-label">Barrio</span>
            <span className="data-value">{alquiler.barrio}</span>
          </div>
          <div className="data-item data-grid-full">
            <span className="data-label">Dirección</span>
            <span className="data-value">{alquiler.direccion}</span>
          </div>
        </div>
      </div>

      {/* Bloque 2: Tiempos y Vigencia */}
      <div className="data-group">
        <p className="data-group-title">📅 Tiempos &amp; Estado</p>
        <div className="data-grid">
          <div className="data-item">
            <span className="data-label">Fecha de inicio</span>
            <span className="data-value">{alquiler.fecha_inicio}</span>
          </div>
          <div className="data-item">
            <span className="data-label">Duración</span>
            <span className="data-value">{alquiler.tiempo_alquiler_dias} día(s)</span>
          </div>
          <div className="data-item">
            <span className="data-label">Fecha de vencimiento</span>
            <span className="data-value">{alquiler.fecha_vencimiento}</span>
          </div>
          <div className="data-item">
            <span className="data-label">Estado</span>
            <span className={claseBadgePorTono(etiquetaVencimiento.tono)}
              style={{ alignSelf: "flex-start", fontSize: 12 }}>
              {etiquetaVencimiento.texto}
            </span>
          </div>
        </div>
      </div>

      {/* Bloque 3: Resumen Financiero */}
      <div className="data-group">
        <p className="data-group-title">💰 Resumen Financiero</p>
        <div className="data-grid">
          <div className="data-item">
            <span className="data-label">Canon alquiler</span>
            <span className="data-value">
              ${canonPuro.toLocaleString("es-CO")}
            </span>
          </div>
          <div className="data-item">
            <span className="data-label">Depósito en garantía</span>
            <span className="data-value">
              ${alquiler.deposito.toLocaleString("es-CO")}
            </span>
          </div>
          <div className="data-item data-grid-full">
            <span className="data-label">Total del contrato</span>
            <span className="data-value-highlight">
              ${alquiler.precio_alquiler.toLocaleString("es-CO")}
            </span>
          </div>
        </div>
      </div>


      {/* Bloque 4: Logística y Trazabilidad */}
      <div className="data-group">
        <p className="data-group-title">🚚 Logística &amp; Auditoría</p>
        <div className="data-grid">
          <div className="data-item">
            <span className="data-label">Despacho</span>
            <span className="data-value">
              {alquiler.se_lleva ? "Se lleva a obra" : "El cliente recoge"}
            </span>
          </div>
          <div className="data-item">
            <span className="data-label">Recogida</span>
            <span className="data-value">
              {alquiler.se_recoge ? "Se recoge" : "El cliente devuelve"}
            </span>
          </div>
          <div className="data-item data-grid-full">
            <span className="data-label">Registrado por</span>
            <span className="data-value">
              {alquiler.nombres_creador} {alquiler.apellidos_creador}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
