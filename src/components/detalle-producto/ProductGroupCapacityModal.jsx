import { useEffect, useMemo, useState } from "react";

import {
  fetchProductCapacityDetailByDateFromSupabase,
} from "../../services/products/adminCalendar";

function formatDateLabel(dateValue) {
  if (!dateValue) {
    return "Por definir";
  }

  const parsedDate = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveDefaultConsultationDate({ activationSnapshot, groupCapacitySnapshot }) {
  const currentActivation = groupCapacitySnapshot?.currentActivation ?? null;
  const nextActiveRange = activationSnapshot?.nextActiveRange ?? null;
  const today = getTodayKey();

  if (
    currentActivation?.fecha_inicio &&
    currentActivation?.fecha_fin &&
    currentActivation.fecha_inicio <= today &&
    currentActivation.fecha_fin >= today
  ) {
    return today;
  }

  if (currentActivation?.fecha_inicio) {
    return currentActivation.fecha_inicio;
  }

  if (nextActiveRange?.fecha_inicio) {
    return nextActiveRange.fecha_inicio;
  }

  return "";
}

function buildCapacitySummary({
  groupCapacitySnapshot,
  isLoadingGroupCapacitySnapshot,
  isProductInactive,
}) {
  if (isProductInactive) {
    return {
      title: "Debes habilitar las fechas primero",
      description:
        "La configuracion de cupos por fecha se consulta una vez el producto vuelve a tener fechas activas operables.",
    };
  }

  if (isLoadingGroupCapacitySnapshot) {
    return {
      title: "Cargando configuracion de cupos",
      description:
        "Estamos consultando la activacion operativa y la capacidad configurada para este producto.",
    };
  }

  const configuredCapacity =
    groupCapacitySnapshot?.currentActivation?.default_capacity ??
    groupCapacitySnapshot?.nextCapacityOverride?.capacity_override ??
    null;

  if (!configuredCapacity) {
    return {
      title: "Sin cupo por fecha cargado",
      description:
        "Todavia no encontramos una configuracion de cupos cargada para las fechas activas de este producto.",
    };
  }

  const overrideCount = Number(groupCapacitySnapshot?.overrideCount ?? 0);
  const nextCapacityOverride = groupCapacitySnapshot?.nextCapacityOverride ?? null;

  return {
    title: `${configuredCapacity} cupos base por fecha`,
    description: nextCapacityOverride
      ? `${overrideCount} ajustes manuales futuros detectados. Proximo ajuste: ${nextCapacityOverride.capacity_override} cupos el ${formatDateLabel(nextCapacityOverride.fecha)}.`
      : "",
  };
}

export default function ProductGroupCapacityModal({
  productId,
  productName,
  activationSnapshot,
  groupCapacitySnapshot,
  isLoadingGroupCapacitySnapshot,
  isProductInactive,
  onClose,
}) {
  const nextActiveRange = activationSnapshot?.nextActiveRange ?? null;
  const helperMessage = isProductInactive
    ? "Primero debes habilitar las fechas activas operables de este producto para consultar la configuracion de cupos por fecha."
    : `Consulta una fecha concreta para ver los cupos operativos de ${productName}.`;
  const capacitySummary = buildCapacitySummary({
    groupCapacitySnapshot,
    isLoadingGroupCapacitySnapshot,
    isProductInactive,
  });
  const defaultConsultationDate = useMemo(
    () =>
      resolveDefaultConsultationDate({
        activationSnapshot,
        groupCapacitySnapshot,
      }),
    [activationSnapshot, groupCapacitySnapshot],
  );
  const [selectedDate, setSelectedDate] = useState(defaultConsultationDate);
  const [capacityDetail, setCapacityDetail] = useState(null);
  const [isLoadingCapacityDetail, setIsLoadingCapacityDetail] = useState(false);
  const [capacityDetailError, setCapacityDetailError] = useState("");

  useEffect(() => {
    setSelectedDate(defaultConsultationDate);
  }, [defaultConsultationDate]);

  useEffect(() => {
    let isMounted = true;

    if (isProductInactive || !productId || !selectedDate) {
      setCapacityDetail(null);
      setCapacityDetailError("");
      setIsLoadingCapacityDetail(false);
      return undefined;
    }

    setIsLoadingCapacityDetail(true);
    setCapacityDetailError("");

    fetchProductCapacityDetailByDateFromSupabase({
      productId,
      date: selectedDate,
    })
      .then((detail) => {
        if (isMounted) {
          setCapacityDetail(detail);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setCapacityDetail(null);
          setCapacityDetailError(
            error?.message ||
              "No fue posible consultar la capacidad operativa de la fecha.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCapacityDetail(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isProductInactive, productId, selectedDate]);

  return (
    <div
      className="detalle-producto-admin-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="detalle-producto-admin-modal panel-control-group-capacity-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-producto-group-capacity-modal-title"
      >
        <button
          type="button"
          className="detalle-producto-admin-modal-close"
          onClick={onClose}
          aria-label="Cerrar configuracion de cupos"
        >
          <span className="material-icons-outlined">close</span>
        </button>

        <p>Configuracion operativa</p>
        <h3 id="detalle-producto-group-capacity-modal-title">Ver Cupos</h3>
        <span>{helperMessage}</span>

        <div className="panel-control-group-capacity-modal-grid">
          <article className="panel-control-group-capacity-modal-card">
            <span>Estado actual</span>
            <strong>{activationSnapshot?.title || "Sin activacion operativa"}</strong>
            {activationSnapshot?.description ? null : (
              <small>
                Todavia no hay una ventana operativa vigente registrada para este producto.
              </small>
            )}
          </article>

          <article className="panel-control-group-capacity-modal-card">
            <span>Configuracion de cupos</span>
            <strong>{capacitySummary.title}</strong>
            <small>{capacitySummary.description}</small>
          </article>

          <article className="panel-control-group-capacity-modal-card">
            <span>Fechas activas operables</span>
            <strong>
              {nextActiveRange
                ? `Del ${formatDateLabel(nextActiveRange.fecha_inicio)} al ${formatDateLabel(nextActiveRange.fecha_fin)}`
                : "Sin rango futuro cargado"}
            </strong>
          </article>
        </div>

        {!isProductInactive ? (
          <>
            <div className="panel-control-group-capacity-modal-filter">
              <label>
                <span>Fecha a consultar</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </label>
            </div>

            {isLoadingCapacityDetail ? (
              <div className="panel-control-group-capacity-modal-note">
                <strong>Consultando la fecha seleccionada</strong>
                <p>
                  Estamos revisando el cupo efectivo, las reservas activas y la
                  disponibilidad real de esta fecha.
                </p>
              </div>
            ) : capacityDetailError ? (
              <div className="panel-control-group-capacity-modal-note panel-control-group-capacity-modal-note--warning">
                <strong>No pudimos consultar esa fecha</strong>
                <p>{capacityDetailError}</p>
              </div>
            ) : capacityDetail ? (
              <>
                <div className="panel-control-group-capacity-modal-grid panel-control-group-capacity-modal-grid--detail">
                  <article className="panel-control-group-capacity-modal-card">
                    <span>Ajuste manual de la fecha</span>
                    <strong>
                      {capacityDetail.hasManualCapacityOverride
                        ? `${capacityDetail.capacityOverride} cupos`
                        : "Sin ampliacion manual"}
                    </strong>
                    <small>
                      {capacityDetail.hasManualCapacityOverride
                        ? "Esta fecha ya tiene un capacity_override aplicado."
                        : "La fecha sigue usando el cupo base del rango."}
                    </small>
                  </article>

                  <article className="panel-control-group-capacity-modal-card">
                    <span>Pasajeros reservados</span>
                    <strong>{capacityDetail.occupiedPassengers} pasajeros</strong>
                    <small>
                      {capacityDetail.reservationCount} reservas activas impactan esta fecha.
                    </small>
                  </article>

                  <article className="panel-control-group-capacity-modal-card">
                    <span>Cupos disponibles</span>
                    <strong>{capacityDetail.availableCapacity} cupos</strong>
                    <small>
                      Disponibilidad real para seguir vendiendo esta fecha hoy.
                    </small>
                  </article>

                  <article className="panel-control-group-capacity-modal-card">
                    <span>Ocupacion actual</span>
                    <strong>{capacityDetail.occupancyPercentage}%</strong>
                    <small>
                      Intensidad que hoy deberia reflejar el calendario para esta fecha.
                    </small>
                  </article>
                </div>
              </>
            ) : null}
          </>
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
