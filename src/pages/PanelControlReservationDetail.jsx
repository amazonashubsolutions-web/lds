import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import LoadingState from "../components/common/LoadingState";
import PrimaryHeader from "../components/layout/PrimaryHeader";
import { usePanelSession } from "../contexts/PanelSessionContext";
import DashboardSidebar from "../components/panel-control/DashboardSidebar";
import Footer from "../components/resultados/Footer";
import {
  footerData,
  panelControlMenu,
  panelControlProfile,
} from "../data/panelControlData";
import { fetchReservationDetailFromSupabase } from "../services/reservations/adminReservations";

function formatDate(value, options = {}) {
  if (!value) {
    return "Por definir";
  }

  const parsedDate = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", options).format(parsedDate);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatStatusLabel(value) {
  if (value === "issued") {
    return "Emitido";
  }

  if (value === "refund_in_progress") {
    return "Reembolso";
  }

  if (value === "cancelled_by_user" || value === "cancelled_by_expiration") {
    return "Cancelada";
  }

  return "Reservado";
}

function formatPaymentAttemptStatusLabel(value) {
  if (value === "paid") {
    return "Pago completado";
  }

  if (value === "requires_redirect") {
    return "Pago pendiente de checkout";
  }

  if (value === "failed") {
    return "Pago fallido";
  }

  if (value === "expired") {
    return "Pago expirado";
  }

  return "Pago pendiente";
}

function getReservationStatusTone(value) {
  if (value === "issued") {
    return "is-issued";
  }

  if (value === "refund_in_progress") {
    return "is-refund";
  }

  if (value === "cancelled_by_user" || value === "cancelled_by_expiration") {
    return "is-cancelled";
  }

  return "is-reserved";
}

function getActivityHistoryTone(entry) {
  if (entry.kind === "payment_event") {
    if (entry.newStatus === "paid") {
      return "is-issued";
    }

    if (entry.newStatus === "failed" || entry.newStatus === "expired") {
      return "is-cancelled";
    }

    return "is-payment";
  }

  return getReservationStatusTone(entry.newStatus);
}

function createSidebarProfile(profile) {
  if (!profile) {
    return panelControlProfile;
  }

  return {
    ...panelControlProfile,
    name:
      [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
      profile.email ||
      panelControlProfile.name,
    role:
      profile.role === "super_user"
        ? "Super User"
        : profile.role === "agency_admin"
          ? "Agency Admin"
          : "Travel Agent",
    email: profile.email || panelControlProfile.email,
    avatar: profile.photo_url || panelControlProfile.avatar,
  };
}

export default function PanelControlReservationDetailPage() {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const { profile } = usePanelSession();
  const [reservationDetail, setReservationDetail] = useState(null);
  const [isLoadingReservation, setIsLoadingReservation] = useState(true);
  const [reservationLoadError, setReservationLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setIsLoadingReservation(true);
    setReservationLoadError("");

    fetchReservationDetailFromSupabase(reservationId)
      .then((detail) => {
        if (isMounted) {
          setReservationDetail(detail);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setReservationDetail(null);
          setReservationLoadError(
            error?.message || "No fue posible abrir el detalle de la reserva.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingReservation(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reservationId]);

  const sidebarProfile = useMemo(() => createSidebarProfile(profile), [profile]);

  const passengerStats = useMemo(() => {
    const passengers = reservationDetail?.passengers ?? [];

    return {
      total: passengers.length,
      adults: passengers.filter((passenger) => passenger.passengerType === "ADT").length,
      children: passengers.filter((passenger) => passenger.passengerType === "CHD").length,
      infants: passengers.filter((passenger) => passenger.passengerType === "INF").length,
    };
  }, [reservationDetail]);

  const reservationStatusLabel = useMemo(
    () => formatStatusLabel(reservationDetail?.status),
    [reservationDetail?.status],
  );

  return (
    <div className="panel-control-page">
      <PrimaryHeader />

      <main className="panel-control-main">
        <div className="panel-control-layout">
          <DashboardSidebar menu={panelControlMenu} profile={sidebarProfile} />

          <section className="panel-control-content panel-control-reservation-detail-page">
            {isLoadingReservation ? (
              <section className="panel-control-card panel-control-reservations-empty">
                <LoadingState
                  title="Abriendo reserva"
                  description="Estamos consultando el detalle completo de la reserva en Supabase."
                />
              </section>
            ) : !reservationDetail ? (
              <section className="panel-control-card panel-control-reservations-empty">
                <strong>No pudimos abrir la reserva.</strong>
                <p>
                  {reservationLoadError ||
                    "La reserva no existe o no tienes acceso a esta operacion."}
                </p>
                <Link
                  className="detalle-producto-unavailable-button"
                  to="/panel-de-control/reservas"
                >
                  Volver a reservas
                </Link>
              </section>
            ) : (
              <>
                <header className="panel-control-products-hero panel-control-reservation-detail-hero">
                  <div className="panel-control-products-hero-copy">
                    <p>Detalle de reserva</p>
                    <h1>{reservationDetail.locator}</h1>
                    <div className="panel-control-products-hero-tags">
                      <span
                        className={`panel-control-products-hero-tag panel-control-reservation-status-chip ${getReservationStatusTone(
                          reservationDetail.status,
                        )}`}
                      >
                        {reservationStatusLabel}
                      </span>
                      <span className="panel-control-products-hero-tag">
                        {reservationDetail.product.name}
                      </span>
                      <span className="panel-control-products-hero-tag">
                        {formatDate(reservationDetail.travelDate, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="panel-control-products-hero-action">
                    <button
                      type="button"
                      className="panel-control-products-create panel-control-calendar-back-button"
                      onClick={() => navigate("/panel-de-control/reservas")}
                    >
                      Volver a reservas
                    </button>
                  </div>
                </header>

                <section className="panel-control-products-overview-grid">
                  <article className="panel-control-products-overview-card">
                    <span>Estado de reserva</span>
                    <strong>{reservationStatusLabel}</strong>
                    <p>Estado operativo vigente de la reserva.</p>
                  </article>

                  <article className="panel-control-products-overview-card">
                    <span>Fecha maxima de vencimiento</span>
                    <strong>
                      {reservationDetail.expiresAt
                        ? formatDate(reservationDetail.expiresAt, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "No aplica"}
                    </strong>
                    <p>Solo aplica mientras la reserva se mantenga en estado reservado.</p>
                  </article>

                  <article className="panel-control-products-overview-card">
                    <span>Fecha actividad</span>
                    <strong>
                      {formatDate(reservationDetail.travelDate, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                    <p>{reservationDetail.embarkTime || "Por definir"}</p>
                  </article>

                  <article className="panel-control-products-overview-card">
                    <span>Pasajeros</span>
                    <strong>{passengerStats.total}</strong>
                    <p>
                      {passengerStats.adults} ADT / {passengerStats.children} CHD /{" "}
                      {passengerStats.infants} INF
                    </p>
                  </article>
                </section>

                <section className="panel-control-reservation-detail-layout">
                  <div className="panel-control-card panel-control-reservation-detail-main">
                    <div className="panel-control-reservation-detail-section">
                      <div className="panel-control-reservation-detail-section-head">
                        <div>
                          <p>Operacion reservada</p>
                          <h2>Datos principales de la reserva</h2>
                        </div>
                      </div>

                      <div className="panel-control-reservation-detail-grid">
                        <div>
                          <span>Producto</span>
                          <strong>{reservationDetail.product.name}</strong>
                        </div>
                        <div>
                          <span>Ciudad</span>
                          <strong>{reservationDetail.product.city || "Sin ciudad"}</strong>
                        </div>
                        <div>
                          <span>Fecha actividad</span>
                          <strong>
                            {formatDate(reservationDetail.travelDate, {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </strong>
                        </div>
                        <div>
                          <span>Hora de embarque</span>
                          <strong>{reservationDetail.embarkTime || "Por definir"}</strong>
                        </div>
                        <div>
                          <span>Localizador</span>
                          <strong>{reservationDetail.locator}</strong>
                        </div>
                        <div>
                          <span>Agencia vendedora</span>
                          <strong>{reservationDetail.sellerAgency.name}</strong>
                        </div>
                        <div>
                          <span>Agencia proveedora</span>
                          <strong>{reservationDetail.ownerAgency.name}</strong>
                        </div>
                        <div>
                          <span>Creada por</span>
                          <strong>{reservationDetail.createdBy.name}</strong>
                        </div>
                        <div>
                          <span>Fecha creacion</span>
                          <strong>
                            {formatDate(reservationDetail.createdAt, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </strong>
                        </div>
                        <div>
                          <span>Fecha maxima de vencimiento</span>
                          <strong>
                            {reservationDetail.expiresAt
                              ? formatDate(reservationDetail.expiresAt, {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : "No aplica"}
                          </strong>
                        </div>
                      </div>

                      {reservationDetail.product.summary ? (
                        <div className="panel-control-reservation-detail-note">
                          <span>Resumen del producto</span>
                          <p>{reservationDetail.product.summary}</p>
                        </div>
                      ) : null}

                      {reservationDetail.notesSummary ? (
                        <div className="panel-control-reservation-detail-note">
                          <span>Resumen operativo</span>
                          <p>{reservationDetail.notesSummary}</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="panel-control-reservation-detail-section">
                      <div className="panel-control-reservation-detail-section-head">
                        <div>
                          <p>Manifestacion de pasajeros</p>
                          <h2>Pasajeros registrados</h2>
                        </div>
                      </div>

                      <div className="panel-control-reservation-detail-list">
                        {reservationDetail.passengers.map((passenger) => (
                          <article
                            className="panel-control-reservation-detail-list-card"
                            key={passenger.id}
                          >
                            <strong>{passenger.fullName}</strong>
                            <small>{passenger.passengerType}</small>
                            <small>{passenger.passengerStatus}</small>
                            {passenger.birthDate ? (
                              <small>
                                Nacimiento:{" "}
                                {formatDate(passenger.birthDate, {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </small>
                            ) : null}
                            {passenger.sex ? <small>Sexo: {passenger.sex}</small> : null}
                            <small>
                              {passenger.documentType && passenger.documentNumber
                                ? `${passenger.documentType} ${passenger.documentNumber}`
                                : "Sin documento registrado"}
                            </small>
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>

                  <aside className="panel-control-reservation-detail-sidebar">
                    <section className="panel-control-card panel-control-reservation-detail-sidebar-card">
                      <div className="panel-control-reservation-detail-status-block">
                        <span>Estado de reserva</span>
                        <strong
                          className={`panel-control-reservation-status-chip ${getReservationStatusTone(
                            reservationDetail.status,
                          )}`}
                        >
                          {reservationStatusLabel}
                        </strong>
                        <p>
                          Los movimientos de pago no cambian este estado. Solo quedan
                          registrados dentro del historial de la reserva.
                        </p>
                      </div>

                      <div className="panel-control-reservation-detail-side-list">
                        <div>
                          <span>Valor total</span>
                          <strong>{formatCurrency(reservationDetail.totalAmount)}</strong>
                        </div>
                        <div>
                          <span>Tipo de pago</span>
                          <strong>{reservationDetail.paymentType || "Sin definir"}</strong>
                        </div>
                        <div>
                          <span>Temporada</span>
                          <strong>{reservationDetail.seasonType || "low"}</strong>
                        </div>
                        <div>
                          <span>Origen</span>
                          <strong>{reservationDetail.originType || "direct"}</strong>
                        </div>
                      </div>
                    </section>

                    {reservationDetail.canViewInternalPaymentHistory ? (
                      <section className="panel-control-card panel-control-reservation-detail-sidebar-card">
                        <div className="panel-control-reservation-detail-status-block panel-control-reservation-detail-status-block--internal">
                          <span>Historial interno de pago</span>
                          <strong>
                            {reservationDetail.paymentHistory.length} movimiento
                            {reservationDetail.paymentHistory.length === 1 ? "" : "s"}
                          </strong>
                          <p>
                            Visible solo para usuarios internos de la agencia proveedora
                            y para LDS.
                          </p>
                        </div>
                      </section>
                    ) : null}
                  </aside>
                </section>

                <section className="panel-control-card panel-control-reservation-detail-history-block">
                  <div className="panel-control-reservation-detail-section">
                    <div className="panel-control-reservation-detail-section-head">
                      <div>
                        <p>Bitacora de la reserva</p>
                        <h2>Historial completo</h2>
                      </div>
                      {reservationDetail.canViewInternalPaymentHistory ? (
                        <small>
                          Incluye movimientos internos de pago sin alterar el estado
                          principal de la reserva.
                        </small>
                      ) : null}
                    </div>

                    <div className="panel-control-reservation-detail-timeline">
                      {reservationDetail.activityHistory.length > 0 ? (
                        reservationDetail.activityHistory.map((entry) => (
                          <article
                            className="panel-control-reservation-detail-timeline-item"
                            key={entry.id}
                          >
                            <div className="panel-control-reservation-detail-timeline-item-head">
                              <span
                                className={`panel-control-reservation-detail-timeline-badge ${getActivityHistoryTone(
                                  entry,
                                )}`}
                              >
                                {entry.kind === "payment_event" ? "Pago" : "Reserva"}
                              </span>
                              <strong>
                                {entry.kind === "payment_event"
                                  ? entry.title ||
                                    formatPaymentAttemptStatusLabel(entry.newStatus)
                                  : formatStatusLabel(entry.newStatus)}
                              </strong>
                            </div>
                            <small>{entry.actorName}</small>
                            {entry.description ? <p>{entry.description}</p> : null}
                            <time dateTime={entry.occurredAt}>
                              {formatDate(entry.occurredAt, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </time>
                          </article>
                        ))
                      ) : (
                        <p>Aun no hay historial registrado para esta reserva.</p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="panel-control-card panel-control-reservation-detail-history-block">
                  <div className="panel-control-reservation-detail-section">
                    <div className="panel-control-reservation-detail-section-head">
                      <div>
                        <p>Seguimiento</p>
                        <h2>Notas de la reserva</h2>
                      </div>
                    </div>

                    <div className="panel-control-reservation-detail-timeline">
                      {reservationDetail.notes.length > 0 ? (
                        reservationDetail.notes.map((note) => (
                          <article
                            className="panel-control-reservation-detail-timeline-item"
                            key={note.id}
                          >
                            <strong>{note.createdByName}</strong>
                            <p>{note.body}</p>
                            <time dateTime={note.createdAt}>
                              {formatDate(note.createdAt, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </time>
                          </article>
                        ))
                      ) : (
                        <p>Aun no hay notas cargadas para esta reserva.</p>
                      )}
                    </div>
                  </div>
                </section>
              </>
            )}
          </section>
        </div>
      </main>

      <Footer data={footerData} />
    </div>
  );
}
