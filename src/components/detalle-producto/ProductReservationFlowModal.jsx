import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import { usePanelSession } from "../../contexts/PanelSessionContext";
import LoadingState from "../common/LoadingState";
import { saveReservationDraft } from "../../utils/reservationDraftStorage";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function createPassengerTemplates(passengerFields = [], passengerCounts = {}) {
  const passengerTypeByFieldId = {
    adults: "ADT",
    children: "CHD",
    babies: "INF",
  };
  const typeLabelByCode = {
    ADT: "Adulto",
    CHD: "Niño",
    INF: "Bebé",
  };

  return passengerFields.flatMap((field) => {
    const count = Number(passengerCounts[field.id] ?? 0);
    const passengerType = passengerTypeByFieldId[field.id] ?? "ADT";

    if (!Number.isInteger(count) || count <= 0) {
      return [];
    }

    return Array.from({ length: count }, (_, index) => ({
      id: `${field.id}-${index + 1}`,
      order: index + 1,
      fieldId: field.id,
      passengerType,
      passengerTypeLabel: typeLabelByCode[passengerType] ?? field.label ?? "Pasajero",
      firstName: "",
      lastName: "",
      birthDate: "",
      documentType: "CC",
      documentNumber: "",
      country: "Colombia",
      sex: "",
      phone: "",
    }));
  });
}

function isPassengerComplete(passenger) {
  return Boolean(
    normalizeText(passenger?.firstName) &&
      normalizeText(passenger?.lastName) &&
      normalizeText(passenger?.birthDate) &&
      normalizeText(passenger?.documentType) &&
      normalizeText(passenger?.documentNumber) &&
      normalizeText(passenger?.country) &&
      normalizeText(passenger?.sex),
  );
}

function getCurrentPassengerTitle(passenger, totalPassengers) {
  if (!passenger) {
    return "Pasajero";
  }

  return `${passenger.passengerTypeLabel} ${passenger.order} de ${totalPassengers}`;
}

export default function ProductReservationFlowModal({
  open,
  onClose,
  bookingSnapshot,
}) {
  const navigate = useNavigate();
  const { isAuthenticated, profile, isSessionLoading } = usePanelSession();
  const [passengers, setPassengers] = useState([]);
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);
  const [flowError, setFlowError] = useState("");
  const [isPreparingSummary, setIsPreparingSummary] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setPassengers(
      createPassengerTemplates(
        bookingSnapshot?.passengerFields,
        bookingSnapshot?.passengerCounts,
      ),
    );
    setCurrentPassengerIndex(0);
    setFlowError("");
    setIsPreparingSummary(false);

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [bookingSnapshot, onClose, open]);

  const totalPassengers = passengers.length;
  const currentPassenger = passengers[currentPassengerIndex] ?? null;
  const isViewerAllowedToReserve = Boolean(
    profile?.role === "super_user" ||
      profile?.role === "agency_admin" ||
      profile?.role === "travel_agent",
  );

  const passengerProgressItems = useMemo(
    () =>
      passengers.map((passenger, index) => ({
        passenger,
        index,
        isActive: index === currentPassengerIndex,
        isDone: isPassengerComplete(passenger),
      })),
    [currentPassengerIndex, passengers],
  );

  if (!open) {
    return null;
  }

  function updatePassengerField(key, value) {
    setPassengers((current) =>
      current.map((passenger, index) =>
        index === currentPassengerIndex
          ? { ...passenger, [key]: value }
          : passenger,
      ),
    );
  }

  async function handleContinueToSummary() {
    if (!currentPassenger || !isPassengerComplete(currentPassenger)) {
      setFlowError(
        "Completa todos los datos del pasajero actual antes de continuar.",
      );
      return;
    }

    if (!bookingSnapshot) {
      setFlowError("No pudimos preparar la reserva con la informacion actual.");
      return;
    }

    if (currentPassengerIndex < totalPassengers - 1) {
      setFlowError("");
      setCurrentPassengerIndex((current) => current + 1);
      return;
    }

    try {
      setFlowError("");
      setIsPreparingSummary(true);

      saveReservationDraft({
        bookingSnapshot,
        passengers,
      });

      onClose();
      navigate("/panel-de-control/reservas/nueva");
    } catch (error) {
      setFlowError(
        error?.message ||
          "No pudimos preparar el resumen de la reserva en este momento.",
      );
    } finally {
      setIsPreparingSummary(false);
    }
  }

  function renderAccessState() {
    return (
      <div className="detalle-producto-reservation-flow-state">
        <p>Reserva LDS</p>
        <h3>Necesitas sesión para continuar</h3>
        <span>
          Para crear reservas desde el detalle del producto debes iniciar sesión
          con un usuario operativo de LDS.
        </span>
        <div className="detalle-producto-reservation-flow-actions">
          <button
            type="button"
            className="detalle-producto-admin-modal-button detalle-producto-admin-modal-button--secondary"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const modalContent = (
    <div
      className="detalle-producto-booking-modal-backdrop detalle-producto-reservation-flow-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isPreparingSummary) {
          onClose();
        }
      }}
    >
      <div
        className="detalle-producto-reservation-flow-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Flujo de reserva LDS"
      >
        <button
          type="button"
          className="detalle-producto-admin-modal-close"
          onClick={onClose}
          disabled={isPreparingSummary}
          aria-label="Cerrar"
        >
          ×
        </button>
        <div className="detalle-producto-reservation-flow-modal-scroll">
          {isSessionLoading || !isAuthenticated || !isViewerAllowedToReserve ? (
            renderAccessState()
          ) : isPreparingSummary ? (
            <div className="detalle-producto-reservation-flow-loading-shell">
              <LoadingState
                title="Preparando resumen"
                description="Estamos organizando la información de los pasajeros y generando el localizador provisional."
              />
            </div>
          ) : (
            <>
              <div className="detalle-producto-reservation-flow-head">
                <p>Reserva LDS</p>
                <h3>Ingresa la información de los pasajeros</h3>
                <span>
                  Vamos en orden: primero adultos, luego niños y después bebés.
                </span>
              </div>

              <div className="detalle-producto-reservation-flow-progress">
                {passengerProgressItems.map(({ passenger, index, isActive, isDone }) => (
                  <button
                    type="button"
                    key={passenger.id || `progress-passenger-${index}`}
                    className={`detalle-producto-reservation-flow-progress-item${
                      isActive
                        ? " detalle-producto-reservation-flow-progress-item--active"
                        : isDone
                          ? " detalle-producto-reservation-flow-progress-item--done"
                          : ""
                    }`}
                    onClick={() => setCurrentPassengerIndex(index)}
                  >
                    <strong>{passenger.passengerTypeLabel}</strong>
                    <small>{index + 1}</small>
                  </button>
                ))}
              </div>

              <div className="detalle-producto-reservation-flow-passenger-shell">
                <div className="detalle-producto-reservation-flow-passenger-header">
                  <strong>
                    {getCurrentPassengerTitle(currentPassenger, totalPassengers)}
                  </strong>
                  <small>{currentPassenger?.passengerType}</small>
                </div>

                <div className="detalle-producto-reservation-flow-grid">
                  <label>
                    <span>Nombres</span>
                    <input
                      type="text"
                      value={currentPassenger?.firstName ?? ""}
                      onChange={(event) =>
                        updatePassengerField("firstName", event.target.value)
                      }
                      placeholder="Nombres del pasajero"
                    />
                  </label>

                  <label>
                    <span>Apellidos</span>
                    <input
                      type="text"
                      value={currentPassenger?.lastName ?? ""}
                      onChange={(event) =>
                        updatePassengerField("lastName", event.target.value)
                      }
                      placeholder="Apellidos del pasajero"
                    />
                  </label>

                  <label>
                    <span>Fecha de nacimiento</span>
                    <input
                      type="date"
                      value={currentPassenger?.birthDate ?? ""}
                      onChange={(event) =>
                        updatePassengerField("birthDate", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>Tipo de documento</span>
                    <select
                      value={currentPassenger?.documentType ?? "CC"}
                      onChange={(event) =>
                        updatePassengerField("documentType", event.target.value)
                      }
                    >
                      <option value="CC">CC</option>
                      <option value="CE">CE</option>
                      <option value="TI">TI</option>
                      <option value="PASSPORT">Pasaporte</option>
                      <option value="RC">Registro civil</option>
                    </select>
                  </label>

                  <label>
                    <span>Número de documento</span>
                    <input
                      type="text"
                      value={currentPassenger?.documentNumber ?? ""}
                      onChange={(event) =>
                        updatePassengerField("documentNumber", event.target.value)
                      }
                      placeholder="Documento del pasajero"
                    />
                  </label>

                  <label>
                    <span>Nacionalidad</span>
                    <input
                      type="text"
                      value={currentPassenger?.country ?? ""}
                      onChange={(event) =>
                        updatePassengerField("country", event.target.value)
                      }
                      placeholder="País"
                    />
                  </label>

                  <label>
                    <span>Sexo</span>
                    <select
                      value={currentPassenger?.sex ?? ""}
                      onChange={(event) =>
                        updatePassengerField("sex", event.target.value)
                      }
                    >
                      <option value="">Selecciona</option>
                      <option value="F">Femenino</option>
                      <option value="M">Masculino</option>
                      <option value="X">Otro</option>
                    </select>
                  </label>

                  <label>
                    <span>Teléfono</span>
                    <input
                      type="text"
                      value={currentPassenger?.phone ?? ""}
                      onChange={(event) =>
                        updatePassengerField("phone", event.target.value)
                      }
                      placeholder="Opcional"
                    />
                  </label>
                </div>
              </div>

              {flowError ? (
                <div className="detalle-producto-booking-feedback detalle-producto-booking-feedback--error">
                  {flowError}
                </div>
              ) : null}

              <div className="detalle-producto-reservation-flow-actions">
                <button
                  type="button"
                  className="detalle-producto-admin-modal-button detalle-producto-admin-modal-button--secondary"
                  onClick={onClose}
                  disabled={isPreparingSummary}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="detalle-producto-admin-modal-button"
                  onClick={handleContinueToSummary}
                  disabled={isPreparingSummary}
                >
                  <span>
                    {isPreparingSummary
                      ? "Preparando resumen..."
                      : currentPassengerIndex === totalPassengers - 1
                        ? "Ir al resumen"
                        : "Guardar pasajero"}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
