import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import LoadingState from "../components/common/LoadingState";
import PrimaryHeader from "../components/layout/PrimaryHeader";
import DashboardSidebar from "../components/panel-control/DashboardSidebar";
import Footer from "../components/resultados/Footer";
import {
  footerData,
  panelControlMenu,
  panelControlProfile,
} from "../data/panelControlData";
import {
  createCapacityRequestInSupabase,
  createReservationCheckoutInSupabase,
} from "../services/reservations/adminReservations";
import {
  clearReservationDraft,
  readReservationDraft,
  saveReservationDraft,
} from "../utils/reservationDraftStorage";
import {
  getReservationExpirationDateTime,
  isReservationWithinLast24Hours,
} from "../utils/reservationTiming";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDate(value) {
  if (!value) {
    return "Por definir";
  }

  const parsedDate = new Date(`${value}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

function formatDateTime(value) {
  if (!value) {
    return "Por definir";
  }

  const parsedDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function createImportantNotes() {
  return [
    "El emisor declara haber revisado cuidadosamente y digitado correctamente toda la informacion del pasajero al momento de solicitar la emision de la reserva.",
    "Cualquier error en los datos proporcionados sera responsabilidad exclusiva del emisor y podra generar cargos adicionales, multas o necesidad de reemision de la reserva.",
    "Una vez emitida la reserva, no se realizaran cambios ni devoluciones sin costo, salvo en los casos permitidos por las condiciones tarifarias del proveedor.",
  ];
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

export default function PanelControlReservationCreatePage() {
  const navigate = useNavigate();
  const [reservationDraft, setReservationDraft] = useState(() => readReservationDraft());
  const [flowError, setFlowError] = useState("");
  const [capacityRequestContext, setCapacityRequestContext] = useState(null);
  const [capacityRequestNotice, setCapacityRequestNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingCapacityRequest, setIsSubmittingCapacityRequest] =
    useState(false);
  const [isEmitOnlyModalOpen, setIsEmitOnlyModalOpen] = useState(false);

  const importantNotes = useMemo(() => createImportantNotes(), []);
  const bookingSnapshot = reservationDraft?.bookingSnapshot ?? null;
  const passengers = reservationDraft?.passengers ?? [];
  const reservationExpiresAt = useMemo(
    () => getReservationExpirationDateTime(new Date()),
    [bookingSnapshot],
  );
  const isEmitOnlyFlow = useMemo(
    () =>
      Boolean(bookingSnapshot) &&
      isReservationWithinLast24Hours(
        bookingSnapshot?.travelDate,
        bookingSnapshot?.departureTime,
        new Date(),
      ),
    [bookingSnapshot],
  );
  const isDraftValid =
    Boolean(bookingSnapshot?.productId) &&
    Boolean(bookingSnapshot?.travelDate) &&
    passengers.length > 0 &&
    passengers.every(isPassengerComplete);

  useEffect(() => {
    if (bookingSnapshot && isEmitOnlyFlow) {
      setIsEmitOnlyModalOpen(true);
      return;
    }

    setIsEmitOnlyModalOpen(false);
  }, [bookingSnapshot, isEmitOnlyFlow]);

  function updatePassenger(passengerId, key, value) {
    setReservationDraft((current) => {
      if (!current) {
        return current;
      }

      const nextDraft = {
        ...current,
        passengers: current.passengers.map((passenger) =>
          passenger.id === passengerId
            ? { ...passenger, [key]: value }
            : passenger,
        ),
      };

      saveReservationDraft(nextDraft);
      return nextDraft;
    });
  }

  async function handleConfirmReservation() {
    if (!reservationDraft || !bookingSnapshot) {
      setFlowError("No encontramos la informacion temporal de la reserva.");
      return;
    }

    if (!isDraftValid) {
      setFlowError(
        "Completa correctamente la informacion de todos los pasajeros antes de continuar.",
      );
      return;
    }

    if (isEmitOnlyFlow) {
      setIsEmitOnlyModalOpen(true);
      return;
    }

    setFlowError("");
    setCapacityRequestContext(null);
    setCapacityRequestNotice("");

    try {
      setIsSubmitting(true);
      const createdReservation = await createReservationCheckoutInSupabase({
        productId: bookingSnapshot.productId,
        travelDate: bookingSnapshot.travelDate,
        totalAmount: bookingSnapshot.totalAfterDiscount,
        passengers,
        notesSummary: bookingSnapshot.summaryNote,
        checkoutSnapshot: {
          source: "booking_card_detail",
          product: {
            id: bookingSnapshot.productId,
            title: bookingSnapshot.productName,
            city: bookingSnapshot.productCity,
          },
          travelDate: bookingSnapshot.travelDate,
          passengerCounts: bookingSnapshot.passengerCounts,
          passengerBreakdown: bookingSnapshot.passengerBreakdown,
          additionalCharges: bookingSnapshot.additionalCharges,
          subtotal: bookingSnapshot.estimatedTotal,
          discountAmount: bookingSnapshot.discountAmount,
          totalAfterDiscount: bookingSnapshot.totalAfterDiscount,
          couponCode: bookingSnapshot.appliedCouponCode,
          couponLabel: bookingSnapshot.appliedCouponLabel,
        },
      });

      clearReservationDraft();
      navigate(`/panel-de-control/reservas/${createdReservation.id}`);
    } catch (error) {
      if (error?.code === "CAPACITY_REQUEST_REQUIRED") {
        setCapacityRequestContext(error.capacityRequestContext ?? null);
      }

      setFlowError(
        error?.message || "No fue posible crear la reserva en este momento.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateCapacityRequest() {
    if (!capacityRequestContext || !bookingSnapshot) {
      return;
    }

    try {
      setIsSubmittingCapacityRequest(true);
      const createdRequest = await createCapacityRequestInSupabase({
        productId: bookingSnapshot.productId,
        travelDate: bookingSnapshot.travelDate,
        requestedPassengerCount: passengers.length,
        reason: `Solicitud creada desde el resumen de reserva del producto ${bookingSnapshot.productName}.`,
      });

      setCapacityRequestNotice(
        createdRequest.mailtoUrl
          ? "Solicitud registrada. Vamos a abrir tu correo para notificar a la agencia proveedora."
          : "Solicitud registrada. No encontramos correos activos para abrir el email automaticamente.",
      );

      if (createdRequest.mailtoUrl && typeof window !== "undefined") {
        window.location.href = createdRequest.mailtoUrl;
      }
    } catch (error) {
      setFlowError(
        error?.message ||
          "No fue posible registrar la solicitud de ampliacion de cupo.",
      );
    } finally {
      setIsSubmittingCapacityRequest(false);
    }
  }

  function handleExitDraft() {
    const fallbackPath =
      bookingSnapshot?.productDetailPath || "/panel-de-control/reservas";
    navigate(fallbackPath);
  }

  return (
    <div className="panel-control-page">
      <PrimaryHeader />

      <main className="panel-control-main">
        <div className="panel-control-layout">
          <DashboardSidebar menu={panelControlMenu} profile={panelControlProfile} />

          <section className="panel-control-content panel-control-reservation-create-page">
            {!reservationDraft || !bookingSnapshot ? (
              <section className="panel-control-card panel-control-reservations-empty">
                <strong>No hay una reserva en preparacion.</strong>
                <p>
                  Vuelve al detalle del producto y comienza nuevamente el flujo
                  desde el booking card.
                </p>
                <Link
                  className="detalle-producto-unavailable-button"
                  to="/panel-de-control/reservas"
                >
                  Ir a reservas
                </Link>
              </section>
            ) : (
              <>
                <header className="panel-control-products-hero panel-control-reservation-detail-hero">
                  <div className="panel-control-products-hero-copy">
                    <p>Reserva</p>
                    <h1>Resumen de reserva</h1>
                    <div className="panel-control-products-hero-tags">
                      <span className="panel-control-products-hero-tag">
                        {bookingSnapshot.productName}
                      </span>
                      <span className="panel-control-products-hero-tag">
                        {formatDate(bookingSnapshot.travelDate)}
                      </span>
                      <span className="panel-control-products-hero-tag">
                        Reservado
                      </span>
                    </div>
                  </div>

                  <div className="panel-control-products-hero-action">
                    <button
                      type="button"
                      className="panel-control-products-create panel-control-calendar-back-button"
                      onClick={handleExitDraft}
                    >
                      Volver
                    </button>
                  </div>
                </header>

                {flowError ? (
                  <div className="panel-control-inline-notice panel-control-inline-notice--error">
                    {flowError}
                  </div>
                ) : null}

                {isEmitOnlyFlow ? (
                  <div className="panel-control-inline-notice panel-control-inline-notice--warning">
                    Esta actividad ya esta dentro de las ultimas 24 horas. Desde
                    este flujo ya no se puede reservar; unicamente emitir.
                  </div>
                ) : null}

                {capacityRequestContext ? (
                  <section className="detalle-producto-reservation-capacity-request">
                    <strong>Cupo insuficiente para esta fecha</strong>
                    <small>
                      Solo hay {capacityRequestContext.currentAvailableCapacity} cupo
                      {capacityRequestContext.currentAvailableCapacity === 1 ? "" : "s"}{" "}
                      disponible
                      {capacityRequestContext.currentAvailableCapacity === 1 ? "" : "s"}.
                    </small>
                    {capacityRequestNotice ? (
                      <p>{capacityRequestNotice}</p>
                    ) : (
                      <p>
                        Si necesitas completar la venta, puedes registrar una
                        solicitud previa de ampliacion de cupo para esta fecha.
                      </p>
                    )}
                    <div className="detalle-producto-reservation-flow-actions">
                      <button
                        type="button"
                        className="detalle-producto-admin-modal-button detalle-producto-admin-modal-button--secondary"
                        onClick={() => setCapacityRequestContext(null)}
                        disabled={isSubmittingCapacityRequest}
                      >
                        Cerrar
                      </button>
                      <button
                        type="button"
                        className="detalle-producto-admin-modal-button"
                        onClick={handleCreateCapacityRequest}
                        disabled={isSubmittingCapacityRequest}
                      >
                        <span>
                          {isSubmittingCapacityRequest
                            ? "Registrando solicitud..."
                            : "Solicitar ampliacion"}
                        </span>
                      </button>
                    </div>
                  </section>
                ) : null}

                <section className="panel-control-reservation-create-layout">
                  <div className="panel-control-reservation-detail-main">
                    <section className="detalle-producto-reservation-summary-locator">
                      <div>
                        <span>Codigo de reserva</span>
                        <strong>Se asignara al aceptar</strong>
                      </div>
                      <div>
                        <span>Estado inicial</span>
                        <strong>Reservado</strong>
                      </div>
                      <div>
                        <span>Fecha maxima de vencimiento</span>
                        <strong>
                          {reservationExpiresAt
                            ? formatDateTime(reservationExpiresAt)
                            : "Por definir"}
                        </strong>
                      </div>
                    </section>

                    <section className="detalle-producto-reservation-summary-section">
                      <div className="detalle-producto-reservation-summary-section-head">
                        <strong>Resumen del producto</strong>
                        <small>Solo consulta</small>
                      </div>
                      <div className="detalle-producto-reservation-summary-grid">
                        <article>
                          <span>Producto</span>
                          <strong>{bookingSnapshot.productName}</strong>
                        </article>
                        <article>
                          <span>Ciudad</span>
                          <strong>{bookingSnapshot.productCity || "Sin ciudad"}</strong>
                        </article>
                        <article>
                          <span>Fecha actividad</span>
                          <strong>{formatDate(bookingSnapshot.travelDate)}</strong>
                        </article>
                        <article>
                          <span>Hora de salida</span>
                          <strong>{bookingSnapshot.departureTime || "Por definir"}</strong>
                        </article>
                      </div>
                    </section>

                    <section className="detalle-producto-reservation-summary-section">
                      <div className="detalle-producto-reservation-summary-section-head">
                        <strong>Lista de pasajeros</strong>
                        <small>Puedes ajustar sus datos antes de aceptar</small>
                      </div>
                      <div className="panel-control-reservation-create-passenger-list">
                        {passengers.map((passenger) => (
                          <article
                            className="panel-control-reservation-create-passenger-card"
                            key={passenger.id}
                          >
                            <div className="detalle-producto-reservation-flow-passenger-header">
                              <strong>
                                {passenger.passengerTypeLabel} {passenger.order}
                              </strong>
                              <small>{passenger.passengerType}</small>
                            </div>

                            <div className="detalle-producto-reservation-flow-grid">
                              <label>
                                <span>Nombres</span>
                                <input
                                  type="text"
                                  value={passenger.firstName}
                                  onChange={(event) =>
                                    updatePassenger(passenger.id, "firstName", event.target.value)
                                  }
                                />
                              </label>

                              <label>
                                <span>Apellidos</span>
                                <input
                                  type="text"
                                  value={passenger.lastName}
                                  onChange={(event) =>
                                    updatePassenger(passenger.id, "lastName", event.target.value)
                                  }
                                />
                              </label>

                              <label>
                                <span>Fecha de nacimiento</span>
                                <input
                                  type="date"
                                  value={passenger.birthDate}
                                  onChange={(event) =>
                                    updatePassenger(passenger.id, "birthDate", event.target.value)
                                  }
                                />
                              </label>

                              <label>
                                <span>Tipo de documento</span>
                                <select
                                  value={passenger.documentType}
                                  onChange={(event) =>
                                    updatePassenger(passenger.id, "documentType", event.target.value)
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
                                <span>Numero de documento</span>
                                <input
                                  type="text"
                                  value={passenger.documentNumber}
                                  onChange={(event) =>
                                    updatePassenger(
                                      passenger.id,
                                      "documentNumber",
                                      event.target.value,
                                    )
                                  }
                                />
                              </label>

                              <label>
                                <span>Nacionalidad</span>
                                <input
                                  type="text"
                                  value={passenger.country}
                                  onChange={(event) =>
                                    updatePassenger(passenger.id, "country", event.target.value)
                                  }
                                />
                              </label>

                              <label>
                                <span>Sexo</span>
                                <select
                                  value={passenger.sex}
                                  onChange={(event) =>
                                    updatePassenger(passenger.id, "sex", event.target.value)
                                  }
                                >
                                  <option value="">Selecciona</option>
                                  <option value="F">Femenino</option>
                                  <option value="M">Masculino</option>
                                  <option value="X">Otro</option>
                                </select>
                              </label>

                              <label>
                                <span>Telefono</span>
                                <input
                                  type="text"
                                  value={passenger.phone}
                                  onChange={(event) =>
                                    updatePassenger(passenger.id, "phone", event.target.value)
                                  }
                                  placeholder="Opcional"
                                />
                              </label>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  </div>

                  <aside className="panel-control-reservation-detail-sidebar">
                    <section className="detalle-producto-reservation-summary-section">
                      <div className="detalle-producto-reservation-summary-section-head">
                        <strong>Resumen financiero</strong>
                        <small>Solo lectura</small>
                      </div>

                      <div className="detalle-producto-reservation-financial-list">
                        {bookingSnapshot.passengerBreakdown?.map((item) => (
                          <div key={item.id}>
                            <span>
                              {item.label} x{item.count}
                            </span>
                            <strong>{formatCurrency(item.subtotal)}</strong>
                          </div>
                        ))}

                        {bookingSnapshot.additionalCharges?.map((item, index) => (
                          <div key={`${item.label || "charge"}-${index}`}>
                            <span>{item.label}</span>
                            <strong>{formatCurrency(item.value)}</strong>
                          </div>
                        ))}

                        {Number(bookingSnapshot.discountAmount ?? 0) > 0 ? (
                          <div className="detalle-producto-reservation-financial-list-row--discount">
                            <span>
                              Descuento
                              {bookingSnapshot.appliedCouponCode
                                ? ` (${bookingSnapshot.appliedCouponCode})`
                                : ""}
                            </span>
                            <strong>- {formatCurrency(bookingSnapshot.discountAmount)}</strong>
                          </div>
                        ) : null}

                        <div className="detalle-producto-reservation-financial-list-row--final">
                          <span>Total</span>
                          <strong>{formatCurrency(bookingSnapshot.totalAfterDiscount)}</strong>
                        </div>
                      </div>
                    </section>

                    <section className="detalle-producto-reservation-important-box">
                      <strong>Importante</strong>
                      <ul>
                        {importantNotes.map((note, index) => (
                          <li key={`important-note-${index}`}>{note}</li>
                        ))}
                      </ul>
                    </section>

                    <div className="detalle-producto-reservation-flow-actions">
                      <button
                        type="button"
                        className="detalle-producto-admin-modal-button detalle-producto-admin-modal-button--secondary"
                        onClick={handleExitDraft}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="detalle-producto-admin-modal-button"
                        onClick={handleConfirmReservation}
                        disabled={isSubmitting || isEmitOnlyFlow}
                      >
                        <span>
                          {isSubmitting
                            ? "Creando reserva..."
                            : isEmitOnlyFlow
                              ? "Solo emitir"
                              : "Aceptar"}
                        </span>
                      </button>
                    </div>
                  </aside>
                </section>
              </>
            )}
          </section>
        </div>
      </main>

      <Footer data={footerData} />

      {isEmitOnlyModalOpen ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={() => setIsEmitOnlyModalOpen(false)}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal panel-control-reservations-modal panel-control-reservation-expiration-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-control-reservation-emit-only-title"
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={() => setIsEmitOnlyModalOpen(false)}
              aria-label="Cerrar aviso de emision"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Regla de reserva</p>
            <h3 id="panel-control-reservation-emit-only-title">
              Solo emision disponible
            </h3>
            <span>
              Esta reserva esta siendo creada menos de 24 horas de la fecha de
              la actividad por lo tanto no se puede reservar. Unicamente emitir.
            </span>

            <div className="panel-control-reservation-expiration-modal-summary">
              <div>
                <span>Producto</span>
                <strong>{bookingSnapshot?.productName || "Producto LDS"}</strong>
              </div>
              <div>
                <span>Fecha actividad</span>
                <strong>{formatDate(bookingSnapshot?.travelDate)}</strong>
              </div>
              <div>
                <span>Hora de salida</span>
                <strong>{bookingSnapshot?.departureTime || "Por definir"}</strong>
              </div>
              <div>
                <span>Limite de reserva</span>
                <strong>
                  {reservationExpiresAt
                    ? formatDateTime(reservationExpiresAt)
                    : "Por definir"}
                </strong>
              </div>
            </div>

            <div className="detalle-producto-admin-modal-actions">
              <button
                type="button"
                className="detalle-producto-admin-modal-button"
                onClick={() => setIsEmitOnlyModalOpen(false)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isSubmitting ? (
        <div className="detalle-producto-admin-modal-backdrop" role="presentation" style={{ zIndex: 9999 }}>
          <div
            className="detalle-producto-admin-modal panel-control-reservations-modal"
            role="dialog"
            aria-modal="true"
            style={{ textAlign: "center", padding: "3rem 2rem", maxWidth: "400px" }}
          >
            <div style={{ margin: "0 auto 1.5rem" }}>
              <LoadingState
                title="Creando reserva"
                description="Por favor espera un momento mientras registramos la reserva."
              />
            </div>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
              Estamos preparando tu localizador y el comprobante inicial en LDS...
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
