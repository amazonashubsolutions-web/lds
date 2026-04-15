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
import {
  fetchReservationDetailFromSupabase,
  cancelReservationInSupabase,
} from "../services/reservations/adminReservations";

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
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

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

  async function handleCancelReservation(event) {
    event.preventDefault();
    setCancelError("");

    try {
      setIsCancelling(true);
      const updatedDetail = await cancelReservationInSupabase({
        reservationId: reservationDetail.id,
        reasonNotes: cancelReason,
      });

      setReservationDetail(updatedDetail);
      setCancelModalOpen(false);
      setCancelReason("");
    } catch (error) {
      setCancelError(error?.message || "No fue posible cancelar la reserva.");
    } finally {
      setIsCancelling(false);
    }
  }

  function openCancelModal() {
    setCancelError("");
    setCancelReason("");
    setCancelModalOpen(true);
  }

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
                    <h1 style={{ marginBottom: "8px" }}>Detalle Reserva: {reservationDetail.locator}</h1>
                    <p style={{ fontSize: "1.35rem", color: "white", margin: 0, fontWeight: "500" }}>{reservationDetail.product.name}</p>
                  </div>

                  <div className="panel-control-products-hero-action" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {reservationDetail.status !== "cancelled_by_user" && reservationDetail.status !== "cancelled_by_expiration" ? (
                      <button
                        type="button"
                        className="panel-control-products-create panel-control-calendar-back-button"
                        style={{ backgroundColor: "#dc2626", color: "white", borderColor: "#dc2626" }}
                        onClick={openCancelModal}
                      >
                        Cancelar reserva
                      </button>
                    ) : null}
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
                    <strong style={{ fontSize: "1.25rem" }}>{reservationStatusLabel}</strong>
                    <p>Estado operativo vigente de la reserva.</p>
                  </article>

                  <article className="panel-control-products-overview-card">
                    <span>Fecha maxima de vencimiento</span>
                    <strong style={{ fontSize: "1.25rem" }}>
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
                    <strong style={{ fontSize: "1.25rem" }}>
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
                    <strong style={{ fontSize: "1.25rem" }}>{passengerStats.total}</strong>
                    <p>
                      {passengerStats.adults} ADT / {passengerStats.children} CHD /{" "}
                      {passengerStats.infants} INF
                    </p>
                  </article>

                  <article className="panel-control-products-overview-card">
                    <span>Valor total</span>
                    <strong style={{ fontSize: "1.25rem" }}>{formatCurrency(reservationDetail.totalAmount)}</strong>
                    <p>Monto consolidado en {reservationDetail.currency || "COP"}.</p>
                  </article>
                </section>

                <section className="panel-control-card panel-control-reservation-detail-history-block">
                    <div className="panel-control-reservation-detail-section">
                      <div className="panel-control-reservation-detail-section-head">
                        <div>
                          <p>Operacion reservada</p>
                          <h2>Datos principales de la reserva</h2>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px", alignItems: "stretch" }}>
                        <div className="panel-control-reservation-detail-feature-card" style={{ display: "flex", flexDirection: "column", backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }}>
                          <div style={{ position: "relative" }}>
                            <img 
                              src={reservationDetail.product.imageUrl || "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&h=400&fit=crop"} 
                              alt={reservationDetail.product.name} 
                              style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }} 
                            />
                          </div>
                          
                          <div style={{ padding: "20px 16px 16px" }}>
                            <span style={{ display: "block", fontSize: "0.8rem", color: "#0891b2", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
                              {reservationDetail.product.category ? (reservationDetail.product.category.toUpperCase().replace(/_/g, " ")) : "CATEGORIA"} {reservationDetail.product.subcategory ? `- ${reservationDetail.product.subcategory.toUpperCase().replace(/_/g, " ")}` : ""}
                            </span>
                            <h3 style={{ fontSize: "1.25rem", color: "#111827", fontWeight: "700", margin: "0 0 20px" }}>
                              {reservationDetail.product.name}
                            </h3>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                              <div>
                                <span style={{ display: "block", fontSize: "0.7rem", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", marginBottom: "6px" }}>Horario de salida</span>
                                <strong style={{ fontSize: "0.95rem", color: "#111827", fontWeight: "700" }}>{reservationDetail.product.departureTime || "Por definir"}</strong>
                              </div>
                              <div>
                                <span style={{ display: "block", fontSize: "0.7rem", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", marginBottom: "6px" }}>Punto de encuentro</span>
                                <strong style={{ fontSize: "0.95rem", color: "#111827", fontWeight: "700" }}>{reservationDetail.product.meetingPoint || "Por confirmar"}</strong>
                              </div>
                            </div>

                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowX: "auto" }}>
                          {reservationDetail.product.summary ? (
                            <div className="panel-control-reservation-detail-note" style={{ margin: "0 0 16px 0" }}>
                              <span style={{ fontWeight: "bold", color: "#111827" }}>Resumen del producto</span>
                              <p>{reservationDetail.product.summary}</p>
                            </div>
                          ) : null}
                          <table style={{ width: "100%", height: "100%", whiteSpace: "nowrap", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                <th style={{ padding: "12px 16px", color: "#111827", fontWeight: "bold", fontSize: "0.875rem" }}>Campo</th>
                                <th style={{ padding: "12px 16px", color: "#111827", fontWeight: "bold", fontSize: "0.875rem" }}>Valor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { label: "Fecha actividad", value: formatDate(reservationDetail.travelDate, { day: "numeric", month: "long", year: "numeric" }) },
                                { label: "Localizador", value: reservationDetail.locator },
                                { label: "Agencia vendedora", value: reservationDetail.sellerAgency.name },
                                { label: "Agencia proveedora", value: reservationDetail.ownerAgency.name },
                                { label: "Creada por", value: reservationDetail.createdBy.name },
                                { label: "Fecha creacion", value: formatDate(reservationDetail.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) },
                              ].map((item, index) => (
                                <tr key={index} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                  <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</td>
                                  <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#111827", fontWeight: "600" }}>{item.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                </section>

                <section className="panel-control-card panel-control-reservation-detail-history-block">
                    <div className="panel-control-reservation-detail-section">
                      <div className="panel-control-reservation-detail-section-head">
                        <div>
                          <p>Manifestacion de pasajeros</p>
                          <h2>Pasajeros registrados</h2>
                        </div>
                      </div>

                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", whiteSpace: "nowrap", borderCollapse: "collapse", textAlign: "left" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                              <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Nombre Completo</th>
                              <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Tipo</th>
                              <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Estado</th>
                              <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Nacimiento</th>
                              <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Sexo</th>
                              <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Documento</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reservationDetail.passengers.map((passenger) => (
                              <tr key={passenger.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#111827", fontWeight: "600" }}>{passenger.fullName}</td>
                                <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#4b5563" }}>{passenger.passengerType}</td>
                                <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#4b5563" }}>{passenger.passengerStatus}</td>
                                <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#4b5563" }}>{passenger.birthDate ? formatDate(passenger.birthDate, { day: "numeric", month: "short", year: "numeric" }) : "-"}</td>
                                <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#4b5563" }}>{passenger.sex || "-"}</td>
                                <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#4b5563" }}>{passenger.documentType && passenger.documentNumber ? `${passenger.documentType} ${passenger.documentNumber}` : "Sin documento"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                </section>

                <section className="panel-control-card panel-control-reservation-detail-history-block">
                    <div className="panel-control-reservation-detail-section">
                      <div className="panel-control-reservation-detail-section-head">
                        <div>
                          <p>Liquidacion</p>
                          <h2>Informacion de Valores</h2>
                        </div>
                      </div>

                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", whiteSpace: "nowrap", borderCollapse: "collapse", textAlign: "left" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                              <th style={{ padding: "12px 16px", color: "#111827", fontWeight: "bold", fontSize: "0.875rem" }}>Tipo de Pasajero</th>
                              <th style={{ padding: "12px 16px", color: "#111827", fontWeight: "bold", fontSize: "0.875rem" }}>Nombre</th>
                              <th style={{ padding: "12px 16px", color: "#111827", fontWeight: "bold", fontSize: "0.875rem", textAlign: "right" }}>Valor total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const passengersSubtotal = reservationDetail.passengers.reduce((sum, p) => sum + (Number(p.chargedRate) || 0), 0);
                              const hasChargedRates = passengersSubtotal > 0;
                              
                              const grossTotal = hasChargedRates 
                                ? passengersSubtotal 
                                : (reservationDetail.discountPercentage > 0 
                                    ? reservationDetail.totalAmount / (1 - (reservationDetail.discountPercentage / 100)) 
                                    : reservationDetail.totalAmount);
                                    
                              const finalTotal = reservationDetail.totalAmount;
                              const discountValue = reservationDetail.discountPercentage > 0 ? (grossTotal - finalTotal) : 0;

                              return (
                                <>
                                  {reservationDetail.passengers.map((passenger) => {
                                    const passengerPrice = Number(passenger.chargedRate) || (grossTotal / Math.max(1, reservationDetail.passengers.length));
                                    const translatedType = passenger.passengerType === "adult" ? "Adulto" : passenger.passengerType === "child" ? "Niño" : passenger.passengerType === "infant" ? "Bebé" : passenger.passengerType;
                                    
                                    return (
                                      <tr key={`val-${passenger.id}`} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                        <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#4b5563", textTransform: "capitalize" }}>
                                          {translatedType}
                                        </td>
                                        <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#4b5563" }}>
                                          {passenger.fullName || "Sin nombre"}
                                        </td>
                                        <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#111827", fontWeight: "500", textAlign: "right" }}>
                                          {formatCurrency(passengerPrice)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  
                                  <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                    <td colSpan="2" style={{ padding: "16px", fontSize: "0.95rem", color: "#111827", fontWeight: "bold" }}>Valor Total</td>
                                    <td style={{ padding: "16px", fontSize: "0.95rem", color: "#111827", fontWeight: "bold", textAlign: "right" }}>
                                      {formatCurrency(grossTotal)}
                                    </td>
                                  </tr>

                                  {reservationDetail.couponCode ? (
                                    <>
                                      <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                        <td colSpan="2" style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#16a34a", fontWeight: "600" }}>
                                          Cupón de Descuento {reservationDetail.couponCode} - {reservationDetail.discountPercentage}%
                                        </td>
                                        <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#16a34a", fontWeight: "600", textAlign: "right" }}>
                                          -{formatCurrency(discountValue)}
                                        </td>
                                      </tr>
                                      <tr style={{ backgroundColor: "#f0fdf4", borderBottom: "1px solid #bbf7d0" }}>
                                        <td colSpan="2" style={{ padding: "16px", fontSize: "1rem", color: "#166534", fontWeight: "bold" }}>Valor con Descuento</td>
                                        <td style={{ padding: "16px", fontSize: "1rem", color: "#166534", fontWeight: "bold", textAlign: "right" }}>
                                          {formatCurrency(finalTotal)}
                                        </td>
                                      </tr>
                                    </>
                                  ) : null}
                                </>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
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

                    <div className="panel-control-reservation-detail-timeline" style={{ overflowX: "auto" }}>
                      {reservationDetail.activityHistory.length > 0 ? (
                        <table style={{ width: "100%", whiteSpace: "nowrap", borderCollapse: "collapse", textAlign: "left" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                              <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Fecha y hora</th>
                              <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Tipo</th>
                              <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Estado</th>
                              <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Responsable</th>
                              <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Detalle</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reservationDetail.activityHistory.map((entry) => (
                              <tr key={entry.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#4b5563" }}>
                                  <time dateTime={entry.occurredAt}>
                                    {formatDate(entry.occurredAt, {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })}
                                  </time>
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                  <span
                                    className={`panel-control-reservation-detail-timeline-badge ${getActivityHistoryTone(
                                      entry,
                                    )}`}
                                  >
                                    {entry.kind === "payment_event" ? "Pago" : "Reserva"}
                                  </span>
                                </td>
                                <td style={{ padding: "12px 16px", fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>
                                  {entry.kind === "payment_event"
                                    ? entry.title ||
                                      formatPaymentAttemptStatusLabel(entry.newStatus)
                                    : formatStatusLabel(entry.newStatus)}
                                </td>
                                <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#4b5563" }}>
                                  {entry.actorName}
                                </td>
                                <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#4b5563" }}>
                                  {entry.description || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p style={{ padding: "16px", color: "#6b7280" }}>Aun no hay historial registrado para esta reserva.</p>
                      )}
                    </div>
                  </div>
                </section>

                {reservationDetail.canViewInternalPaymentHistory ? (
                  <section className="panel-control-card panel-control-reservation-detail-history-block">
                    <div className="panel-control-reservation-detail-section">
                      <div className="panel-control-reservation-detail-section-head">
                        <div>
                          <p>Privado</p>
                          <h2>Historial interno de pago</h2>
                        </div>
                      </div>

                      <div style={{ overflowX: "auto" }}>
                        {reservationDetail.paymentHistory && reservationDetail.paymentHistory.length > 0 ? (
                          <table style={{ width: "100%", whiteSpace: "nowrap", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Fecha y hora</th>
                                <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Estado</th>
                                <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Monto</th>
                                <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Metodo</th>
                                <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Referencia</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reservationDetail.paymentHistory.map((payment, index) => (
                                <tr key={payment.id || index} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                  <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#4b5563" }}>
                                    {payment.createdAt || payment.occurredAt ? formatDate(payment.createdAt || payment.occurredAt, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "-"}
                                  </td>
                                  <td style={{ padding: "12px 16px", fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>{formatPaymentAttemptStatusLabel(payment.status) || payment.status || "-"}</td>
                                  <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#111827" }}>{payment.amount ? formatCurrency(payment.amount) : "-"}</td>
                                  <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#4b5563" }}>{payment.paymentMethod || "-"}</td>
                                  <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#4b5563" }}>{payment.reference || payment.transactionId || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p style={{ padding: "16px", color: "#6b7280" }}>Aun no hay movimientos transaccionales internos registrados.</p>
                        )}
                      </div>
                    </div>
                  </section>
                ) : null}

                <section className="panel-control-card panel-control-reservation-detail-history-block">
                  <div className="panel-control-reservation-detail-section">
                    <div className="panel-control-reservation-detail-section-head">
                      <div>
                        <p>Seguimiento</p>
                        <h2>Notas de la reserva</h2>
                      </div>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                      {reservationDetail.notes.length > 0 ? (
                        <table style={{ width: "100%", whiteSpace: "nowrap", borderCollapse: "collapse", textAlign: "left" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                              <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Fecha y hora</th>
                              <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem" }}>Usuario</th>
                              <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: "600", fontSize: "0.875rem", width: "100%" }}>Nota</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reservationDetail.notes.map((note) => (
                              <tr key={note.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#4b5563", verticalAlign: "top" }}>
                                  {formatDate(note.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                                </td>
                                <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#111827", fontWeight: "600", verticalAlign: "top" }}>{note.createdByName}</td>
                                <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#4b5563", whiteSpace: "normal" }}>{note.body}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p style={{ padding: "16px", color: "#6b7280" }}>Aun no hay notas cargadas para esta reserva.</p>
                      )}
                    </div>
                  </div>
                </section>
              </>
            )}

            {cancelModalOpen ? (
              <div
                className="detalle-producto-admin-modal-backdrop"
                onClick={() => !isCancelling && setCancelModalOpen(false)}
                role="presentation"
              >
                <div
                  className="detalle-producto-admin-modal"
                  onClick={(event) => event.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  style={{ width: "100%", maxWidth: "500px" }}
                >
                  <button
                    type="button"
                    className="detalle-producto-admin-modal-close"
                    onClick={() => !isCancelling && setCancelModalOpen(false)}
                    disabled={isCancelling}
                    aria-label="Cerrar modal"
                    style={{ cursor: "pointer" }}
                  >
                    <span className="material-icons-outlined">close</span>
                  </button>

                  <p>Accion irreversible</p>
                  <h3>Cancelar reserva</h3>

                  <form onSubmit={handleCancelReservation}>
                    <span style={{ display: "block", marginBottom: "1rem", color: "#6b7280" }}>
                      Esta accion marcara la reserva como cancelada y liberara los cupos.
                      Puedes agregar un motivo operativo para el registro.
                    </span>

                    <label className="panel-control-form-field">
                      <span>Motivo de cancelacion (Opcional)</span>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Ej. Solicitud directa del cliente, cambio de fecha, etc."
                        disabled={isCancelling}
                        rows={3}
                        style={{ border: "1px solid #d1d5db", borderRadius: "6px", padding: "8px", width: "100%", resize: "vertical" }}
                      />
                    </label>

                    {cancelError ? (
                      <p className="panel-control-form-error">{cancelError}</p>
                    ) : null}

                    <div className="detalle-producto-admin-modal-actions" style={{ marginTop: "1.5rem" }}>
                      <button
                        type="button"
                        className="detalle-producto-admin-modal-button detalle-producto-admin-modal-button--secondary"
                        onClick={() => setCancelModalOpen(false)}
                        disabled={isCancelling}
                        style={{ cursor: "pointer" }}
                      >
                        Cerrar
                      </button>
                      <button
                        type="submit"
                        className="detalle-producto-admin-modal-button"
                        style={{ backgroundColor: "#dc2626", color: "white", borderColor: "#dc2626", cursor: "pointer" }}
                        disabled={isCancelling}
                      >
                        {isCancelling ? "Cancelando..." : "Confirmar cancelacion"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}
            

          </section>
        </div>
      </main>

      <Footer data={footerData} />
    </div>
  );
}
