import React from "react";

const MODAL_MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

function formatModalDate(monthDay) {
  if (!monthDay) return "";
  const [month, day] = monthDay.split("-");
  const mIndex = Number(month) - 1;
  return `${Number(day)} de ${MODAL_MONTH_NAMES[mIndex]}`;
}

export default function ProductSeasonDatesModal({ periods, onClose }) {
  const hasPeriods = periods && periods.length > 0;

  return (
    <div
      className="detalle-producto-admin-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="detalle-producto-admin-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-producto-season-modal-title"
      >
        <button
          type="button"
          className="detalle-producto-admin-modal-close"
          onClick={onClose}
          aria-label="Cerrar fechas de temporada"
        >
          <span className="material-icons-outlined">close</span>
        </button>

        <p>Informacion operativa</p>
        <h3 id="detalle-producto-season-modal-title">Fechas de Temporada Alta</h3>
        <span>
          {hasPeriods
            ? "Los siguientes periodos se consideran temporada alta para este producto:"
            : "Este producto no tiene periodos de temporada alta configurados."}
        </span>

        {hasPeriods ? (
          <div style={{ display: "grid", gap: "0.8rem", marginTop: "1.5rem", marginBottom: "0.8rem" }}>
            {periods.map((period) => (
              <div key={period.id} style={{ display: "flex", alignItems: "center", gap: "1rem", backgroundColor: "#f8fbfc", padding: "1rem 1.2rem", borderRadius: "1rem", border: "1px solid rgba(15, 118, 110, 0.12)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: "3rem", height: "3rem", backgroundColor: "#e2f2e9", color: "var(--lds-logo-green-dark)", borderRadius: "50%" }}>
                  <span className="material-icons-outlined" style={{ fontSize: "1.45rem" }}>event_available</span>
                </div>
                <div style={{ display: "grid", gap: "0.15rem", textAlign: "left" }}>
                  <strong style={{ color: "var(--on-surface)", fontSize: "0.92rem", lineHeight: "1.2" }}>{period.label || "Periodo de Temporada"}</strong>
                  <span style={{ color: "var(--tertiary)", fontSize: "0.78rem", fontWeight: "600" }}>
                    Del {formatModalDate(period.startMonthDay)} al {formatModalDate(period.endMonthDay)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          className="detalle-producto-admin-modal-button"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
