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
  approveCapacityRequestInSupabase,
  createCapacityRequestInSupabase,
  createReservationInSupabase,
  fetchCapacityRequestListFromSupabase,
  fetchReservationListFromSupabase,
  fetchReservationProductOptionsFromSupabase,
  rejectCapacityRequestInSupabase,
} from "../services/reservations/adminReservations";

const ALL_STATUS_FILTER = "all";
const ALL_EMISSION_DATE_FILTER = "all";
const ALL_TRAVEL_DATE_FILTER = "all";
const ACTIVE_STATUS_FILTER = "active";
const CANCELLED_STATUS_FILTER = "cancelled";

function createTodayDate() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
}

function parseDateOnly(value) {
  const normalizedValue = String(value ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return null;
  }

  const [year, month, day] = normalizedValue.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day, 12, 0, 0, 0);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function diffInDaysFromToday(value) {
  const parsedDate = parseDateOnly(value);

  if (!parsedDate) {
    return null;
  }

  const today = createTodayDate();
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.round((parsedDate.getTime() - today.getTime()) / millisecondsPerDay);
}

function matchesRelativeDateFilter(value, filterValue) {
  if (filterValue === ALL_EMISSION_DATE_FILTER || filterValue === ALL_TRAVEL_DATE_FILTER) {
    return true;
  }

  const diffInDays = diffInDaysFromToday(value);

  if (diffInDays == null) {
    return false;
  }

  if (filterValue === "today") {
    return diffInDays === 0;
  }

  if (filterValue === "yesterday") {
    return diffInDays === -1;
  }

  if (filterValue === "tomorrow") {
    return diffInDays === 1;
  }

  if (filterValue === "last_7_days") {
    return diffInDays <= 0 && diffInDays >= -7;
  }

  if (filterValue === "last_15_days") {
    return diffInDays <= 0 && diffInDays >= -15;
  }

  if (filterValue === "last_30_days") {
    return diffInDays <= 0 && diffInDays >= -30;
  }

  if (filterValue === "next_7_days") {
    return diffInDays >= 0 && diffInDays <= 7;
  }

  if (filterValue === "next_15_days") {
    return diffInDays >= 0 && diffInDays <= 15;
  }

  if (filterValue === "next_30_days") {
    return diffInDays >= 0 && diffInDays <= 30;
  }

  return true;
}

function normalizeText(value) {
  return String(value ?? "").toLowerCase().trim();
}

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
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function formatDateTimeDatePart(value) {
  if (!value) {
    return "Por definir";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return formatDate(value);
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function toDateOnlyKeyFromDateTime(value) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatStatusLabel(value) {
  if (value === "payment_pending") {
    return "Reservado";
  }

  if (value === "payment_failed") {
    return "Reservado";
  }

  if (value === "payment_expired") {
    return "Reservado";
  }

  if (value === "issued") {
    return "Emitida";
  }

  if (value === "refund_in_progress") {
    return "Reembolso";
  }

  if (value === "cancelled_by_user") {
    return "Cancelada";
  }

  if (value === "cancelled_by_expiration") {
    return "Cancelada";
  }

  return "Reservado";
}

function formatCapacityRequestStatusLabel(value) {
  if (value === "approved") {
    return "Aprobada";
  }

  if (value === "rejected") {
    return "Rechazada";
  }

  if (value === "resolved") {
    return "Resuelta";
  }

  return "Pendiente";
}

function createPassengerDraft() {
  return {
    id: `passenger-${Math.random().toString(36).slice(2, 10)}`,
    firstName: "",
    lastName: "",
    passengerType: "ADT",
  };
}

function createReservationFormState() {
  return {
    productId: "",
    travelDate: "",
    paymentType: "transferencia",
    paymentStatus: "pending",
    status: "reserved",
    totalAmount: "",
    notesSummary: "",
    passengers: [createPassengerDraft()],
  };
}

function createCapacityDecisionFormState() {
  return {
    capacity: "",
    resolutionNotes: "",
  };
}

export default function PanelControlReservationsPage() {
  const navigate = useNavigate();
  const [reservationItems, setReservationItems] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [capacityRequests, setCapacityRequests] = useState([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);
  const [isLoadingCapacityRequests, setIsLoadingCapacityRequests] = useState(true);
  const [reservationsLoadError, setReservationsLoadError] = useState("");
  const [capacityRequestsLoadError, setCapacityRequestsLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(ACTIVE_STATUS_FILTER);
  const [selectedEmissionDateFilter, setSelectedEmissionDateFilter] = useState(
    "today",
  );
  const [selectedTravelDateFilter, setSelectedTravelDateFilter] = useState(
    ALL_TRAVEL_DATE_FILTER,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reservationForm, setReservationForm] = useState(() =>
    createReservationFormState(),
  );
  const [createError, setCreateError] = useState("");
  const [capacityRequestContext, setCapacityRequestContext] = useState(null);
  const [capacityRequestNotice, setCapacityRequestNotice] = useState("");
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  const [isSubmittingCapacityRequest, setIsSubmittingCapacityRequest] =
    useState(false);
  const [capacityDecisionModal, setCapacityDecisionModal] = useState(null);
  const [isCapacityRequestsModalOpen, setIsCapacityRequestsModalOpen] = useState(false);
  const [capacityDecisionForm, setCapacityDecisionForm] = useState(() =>
    createCapacityDecisionFormState(),
  );
  const [capacityDecisionError, setCapacityDecisionError] = useState("");
  const [isSubmittingCapacityDecision, setIsSubmittingCapacityDecision] =
    useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadReservationsData() {
      setIsLoadingReservations(true);
      setReservationsLoadError("");

      try {
        const [items, options] = await Promise.all([
          fetchReservationListFromSupabase(),
          fetchReservationProductOptionsFromSupabase(),
        ]);

        if (!isMounted) {
          return;
        }

        setReservationItems(items);
        setProductOptions(options);
      } catch (error) {
        if (isMounted) {
          setReservationItems([]);
          setProductOptions([]);
          setReservationsLoadError(
            error?.message ||
              "No fue posible cargar la base de reservas desde Supabase.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingReservations(false);
        }
      }
    }

    async function loadCapacityRequestsData() {
      setIsLoadingCapacityRequests(true);
      setCapacityRequestsLoadError("");

      try {
        const items = await fetchCapacityRequestListFromSupabase();

        if (!isMounted) {
          return;
        }

        setCapacityRequests(items);
      } catch (error) {
        if (isMounted) {
          setCapacityRequests([]);
          setCapacityRequestsLoadError(
            error?.message ||
              "No fue posible cargar las solicitudes de ampliacion de cupo.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingCapacityRequests(false);
        }
      }
    }

    loadReservationsData();
    loadCapacityRequestsData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredReservationItems = useMemo(() => {
    const normalizedSearchTerm = normalizeText(searchTerm);

    return reservationItems.filter((item) => {
      const haystack = [
        item.locator,
        item.productName,
        item.city,
        item.sellerAgencyName,
        item.createdByName,
      ]
        .map(normalizeText)
        .join(" ");
      const matchesSearch = !normalizedSearchTerm || haystack.includes(normalizedSearchTerm);
      const matchesStatus =
        selectedStatus === ALL_STATUS_FILTER
          ? true
          : selectedStatus === ACTIVE_STATUS_FILTER
            ? ["reserved", "issued"].includes(item.status)
            : selectedStatus === CANCELLED_STATUS_FILTER
              ? [
                  "cancelled_by_user",
                  "cancelled_by_expiration",
                ].includes(item.status)
            : item.status === selectedStatus;
      const matchesEmissionDate = matchesRelativeDateFilter(
        toDateOnlyKeyFromDateTime(item.createdAt),
        selectedEmissionDateFilter,
      );
      const matchesTravelDate = matchesRelativeDateFilter(
        item.travelDate,
        selectedTravelDateFilter,
      );

      return matchesSearch && matchesStatus && matchesEmissionDate && matchesTravelDate;
    });
  }, [
    reservationItems,
    searchTerm,
    selectedStatus,
    selectedEmissionDateFilter,
    selectedTravelDateFilter,
  ]);

  const reservedCount = filteredReservationItems.filter(
    (item) => item.status === "reserved",
  ).length;
  const issuedCount = filteredReservationItems.filter(
    (item) => item.status === "issued",
  ).length;
  const upcomingCount = filteredReservationItems.filter(
    (item) => item.hasCalendarImpact,
  ).length;
  const pendingCapacityRequestsCount = capacityRequests.filter(
    (item) => item.status === "pending",
  ).length;
  const reviewableCapacityRequestsCount = capacityRequests.filter(
    (item) => item.status === "pending" && item.canReview,
  ).length;

  async function loadCapacityRequestsData() {
    setIsLoadingCapacityRequests(true);
    setCapacityRequestsLoadError("");

    try {
      const items = await fetchCapacityRequestListFromSupabase();
      setCapacityRequests(items);
    } catch (error) {
      setCapacityRequests([]);
      setCapacityRequestsLoadError(
        error?.message ||
          "No fue posible cargar las solicitudes de ampliacion de cupo.",
      );
    } finally {
      setIsLoadingCapacityRequests(false);
    }
  }

  function openCreateModal() {
    setCreateError("");
    setCapacityRequestContext(null);
    setCapacityRequestNotice("");
    setReservationForm(createReservationFormState());
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    if (isCreatingReservation) {
      return;
    }

    setIsCreateModalOpen(false);
    setCreateError("");
    setCapacityRequestContext(null);
    setCapacityRequestNotice("");
  }

  function openCapacityDecisionModal(request, action) {
    setCapacityDecisionError("");
    setCapacityDecisionModal({ request, action });
    setCapacityDecisionForm({
      capacity:
        action === "approve" ? String(request.suggestedCapacity || "") : "",
      resolutionNotes: "",
    });
  }

  function closeCapacityDecisionModal() {
    if (isSubmittingCapacityDecision) {
      return;
    }

    setCapacityDecisionModal(null);
    setCapacityDecisionError("");
    setCapacityDecisionForm(createCapacityDecisionFormState());
  }

  function handleProductChange(nextProductId) {
    const matchedProduct = productOptions.find((option) => option.id === nextProductId);

    setReservationForm((current) => ({
      ...current,
      productId: nextProductId,
      totalAmount:
        current.totalAmount || !matchedProduct?.suggestedAmount
          ? current.totalAmount
          : String(matchedProduct.suggestedAmount),
    }));
  }

  function updatePassenger(passengerId, key, value) {
    setReservationForm((current) => ({
      ...current,
      passengers: current.passengers.map((passenger) =>
        passenger.id === passengerId ? { ...passenger, [key]: value } : passenger,
      ),
    }));
  }

  function addPassenger() {
    setReservationForm((current) => ({
      ...current,
      passengers: [...current.passengers, createPassengerDraft()],
    }));
  }

  function removePassenger(passengerId) {
    setReservationForm((current) => ({
      ...current,
      passengers:
        current.passengers.length === 1
          ? current.passengers
          : current.passengers.filter((passenger) => passenger.id !== passengerId),
    }));
  }

  async function handleCreateReservation(event) {
    event.preventDefault();
    setCreateError("");
    setCapacityRequestContext(null);
    setCapacityRequestNotice("");

    try {
      setIsCreatingReservation(true);
      const createdReservation = await createReservationInSupabase(reservationForm);

      setReservationItems((current) => [
        {
          id: createdReservation.id,
          locator: createdReservation.locator,
          status: createdReservation.status,
          reservationType: createdReservation.reservationType,
          bookingDate: createdReservation.bookingDate,
          issueDate: createdReservation.issueDate,
          travelDate: createdReservation.travelDate,
          embarkTime: createdReservation.embarkTime,
          paymentType: createdReservation.paymentType,
          paymentStatus: createdReservation.paymentStatus,
          totalAmount: createdReservation.totalAmount,
          currency: createdReservation.currency,
          seasonType: createdReservation.seasonType,
          notesSummary: createdReservation.notesSummary,
          createdAt: createdReservation.createdAt,
          expiresAt: createdReservation.expiresAt,
          productName: createdReservation.product.name,
          city: createdReservation.product.city,
          sellerAgencyName: createdReservation.sellerAgency.name,
          createdByName: createdReservation.createdBy.name,
          passengerCount: createdReservation.passengers.length,
          hasCalendarImpact: ["reserved", "issued", "refund_in_progress"].includes(
            createdReservation.status,
          ),
        },
        ...current,
      ]);
      setIsCreateModalOpen(false);
      navigate(`/panel-de-control/reservas/${createdReservation.id}`);
    } catch (error) {
      if (error?.code === "CAPACITY_REQUEST_REQUIRED") {
        setCapacityRequestContext(error.capacityRequestContext ?? null);
      }
      setCreateError(
        error?.message || "No fue posible crear la reserva en Supabase.",
      );
    } finally {
      setIsCreatingReservation(false);
    }
  }

  async function handleCreateCapacityRequest() {
    setCreateError("");
    setCapacityRequestNotice("");

    try {
      setIsSubmittingCapacityRequest(true);
      const createdRequest = await createCapacityRequestInSupabase({
        productId: reservationForm.productId,
        travelDate: reservationForm.travelDate,
        requestedPassengerCount: reservationForm.passengers.length,
        reason: reservationForm.notesSummary,
      });

      setCapacityRequestContext(null);
      setCapacityRequestNotice(
        createdRequest.mailtoUrl
          ? "Solicitud registrada. Vamos a abrir tu cliente de correo para contactar a los administradores proveedores."
          : "Solicitud registrada en LDS. No encontramos correos activos para abrir el email automaticamente.",
      );

      if (createdRequest.mailtoUrl && typeof window !== "undefined") {
        window.location.href = createdRequest.mailtoUrl;
      }

      await loadCapacityRequestsData();
    } catch (error) {
      setCreateError(
        error?.message ||
          "No fue posible registrar la solicitud de ampliacion de cupo.",
      );
    } finally {
      setIsSubmittingCapacityRequest(false);
    }
  }

  async function handleSubmitCapacityDecision(event) {
    event.preventDefault();

    if (!capacityDecisionModal?.request) {
      return;
    }

    setCapacityDecisionError("");

    try {
      setIsSubmittingCapacityDecision(true);

      if (capacityDecisionModal.action === "approve") {
        await approveCapacityRequestInSupabase({
          requestId: capacityDecisionModal.request.id,
          newCapacity: capacityDecisionForm.capacity,
          resolutionNotes: capacityDecisionForm.resolutionNotes,
        });
      } else {
        await rejectCapacityRequestInSupabase({
          requestId: capacityDecisionModal.request.id,
          resolutionNotes: capacityDecisionForm.resolutionNotes,
        });
      }

      await loadCapacityRequestsData();
      setCapacityDecisionModal(null);
      setCapacityDecisionError("");
      setCapacityDecisionForm(createCapacityDecisionFormState());
    } catch (error) {
      setCapacityDecisionError(
        error?.message ||
          "No fue posible registrar la decision sobre la solicitud de cupo.",
      );
    } finally {
      setIsSubmittingCapacityDecision(false);
    }
  }

  return (
    <div className="panel-control-page">
      <PrimaryHeader />

      <main className="panel-control-main">
        <div className="panel-control-layout">
          <DashboardSidebar menu={panelControlMenu} profile={panelControlProfile} />

          <section className="panel-control-content panel-control-reservations-page">
            <header className="panel-control-products-hero panel-control-reservations-hero">
              <div className="panel-control-products-hero-copy">
                <p>Panel de reservas</p>
                <h1>Reserva y monitorea operaciones reales</h1>
                <div className="panel-control-reservations-hero-actions">
                  <button
                    type="button"
                    className="panel-control-reservations-hero-action-button"
                    onClick={() => setIsCapacityRequestsModalOpen(true)}
                  >
                    <span className="material-icons-outlined" aria-hidden="true">
                      notifications_active
                    </span>
                    <span>Solicitudes de ampliacion</span>
                    <strong className="panel-control-reservations-hero-action-count">
                      {pendingCapacityRequestsCount}
                    </strong>
                  </button>
                </div>
              </div>

              <div className="panel-control-products-hero-action">
                <button
                  type="button"
                  className="panel-control-products-create panel-control-products-create--hero"
                  onClick={openCreateModal}
                >
                  <span className="material-icons-outlined" aria-hidden="true">
                    add
                  </span>
                  <span>Crear reserva</span>
                </button>
              </div>
            </header>

            <section className="panel-control-products-overview-grid">
              <article className="panel-control-products-overview-card">
                <span>Reservas visibles</span>
                <strong>{filteredReservationItems.length}</strong>
                <p>Operaciones que hoy coinciden con los filtros aplicados.</p>
              </article>

              <article className="panel-control-products-overview-card">
                <span>Reservadas</span>
                <strong>{reservedCount}</strong>
                <p>Reservas creadas que aun no llegan a estado emitido.</p>
              </article>

              <article className="panel-control-products-overview-card">
                <span>Emitidas</span>
                <strong>{issuedCount}</strong>
                <p>Operaciones ya emitidas dentro de la base activa.</p>
              </article>

              <article className="panel-control-products-overview-card">
                <span>Impacto calendario</span>
                <strong>{upcomingCount}</strong>
                <p>Reservas que ya cuentan para bloquear o marcar fechas activas.</p>
              </article>

              <article className="panel-control-products-overview-card">
                <span>Solicitudes pendientes</span>
                <strong>{pendingCapacityRequestsCount}</strong>
                <p>
                  {reviewableCapacityRequestsCount > 0
                    ? `${reviewableCapacityRequestsCount} necesitan decision del proveedor.`
                    : "No hay solicitudes pendientes para revisar ahora."}
                </p>
              </article>
            </section>

            <section className="panel-control-products-filters panel-control-card">
              <div className="panel-control-products-filters-grid panel-control-reservations-filters-grid">
                <label className="panel-control-coupons-filter-field panel-control-products-filter-field panel-control-products-filter-field--search">
                  <span>Buscar reserva</span>
                  <div className="panel-control-coupons-search-input">
                    <span className="material-icons-outlined" aria-hidden="true">
                      search
                    </span>
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Localizador, producto, ciudad o agencia"
                    />
                  </div>
                </label>

                <label className="panel-control-coupons-filter-field panel-control-products-filter-field">
                  <span>Fecha creacion</span>
                  <select
                    value={selectedEmissionDateFilter}
                    onChange={(event) => setSelectedEmissionDateFilter(event.target.value)}
                  >
                    <option value={ALL_EMISSION_DATE_FILTER}>Todas</option>
                    <option value="today">Hoy</option>
                    <option value="yesterday">Ayer</option>
                    <option value="last_7_days">Ultimos 7 dias</option>
                    <option value="last_15_days">Ultimos 15 dias</option>
                    <option value="last_30_days">Ultimos 30 dias</option>
                  </select>
                </label>

                <label className="panel-control-coupons-filter-field panel-control-products-filter-field">
                  <span>Fecha actividad</span>
                  <select
                    value={selectedTravelDateFilter}
                    onChange={(event) => setSelectedTravelDateFilter(event.target.value)}
                  >
                    <option value={ALL_TRAVEL_DATE_FILTER}>Todas</option>
                    <option value="last_30_days">Ultimos 30 dias</option>
                    <option value="last_15_days">Ultimos 15 dias</option>
                    <option value="last_7_days">Ultimos 7 dias</option>
                    <option value="yesterday">Ayer</option>
                    <option value="today">Hoy</option>
                    <option value="tomorrow">Mañana</option>
                    <option value="next_7_days">Proximos 7 dias</option>
                    <option value="next_15_days">Proximos 15 dias</option>
                    <option value="next_30_days">Proximos 30 dias</option>
                  </select>
                </label>

                <label className="panel-control-coupons-filter-field panel-control-products-filter-field">
                  <span>Estado</span>
                  <select
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                  >
                    <option value={ALL_STATUS_FILTER}>Todos</option>
                    <option value={ACTIVE_STATUS_FILTER}>Activo</option>
                    <option value="reserved">Reservado</option>
                    <option value="issued">Emitido</option>
                    <option value="refund_in_progress">Reembolso</option>
                    <option value={CANCELLED_STATUS_FILTER}>Cancelada</option>
                  </select>
                </label>
              </div>
            </section>

            {isLoadingReservations ? (
              <section className="panel-control-card panel-control-reservations-empty">
                <LoadingState
                  title="Cargando reservas"
                  description="Estamos consultando la base real de reservas para mostrarte el inventario operativo actual."
                />
              </section>
            ) : reservationsLoadError ? (
              <section className="panel-control-card panel-control-reservations-empty">
                <strong>No pudimos cargar las reservas.</strong>
                <p>{reservationsLoadError}</p>
              </section>
            ) : filteredReservationItems.length === 0 ? (
              <section className="panel-control-card panel-control-reservations-empty">
                <strong>Aun no hay reservas para esta vista.</strong>
                <p>
                  Crea la primera reserva manual y el calendario comenzara a leer
                  movimientos reales.
                </p>
              </section>
            ) : (
              <section className="panel-control-card panel-control-reservations-table-shell">
                <div className="panel-control-reservations-table-head">
                  <span>Reserva</span>
                  <span>Producto</span>
                  <span>Fecha creacion</span>
                  <span>Fecha actividad</span>
                  <span>Fecha vencimiento</span>
                  <span>Valor</span>
                  <span>Estado</span>
                </div>

                <div className="panel-control-reservations-table-body">
                  {filteredReservationItems.map((reservation) => (
                    <Link
                      className="panel-control-reservations-table-row"
                      key={reservation.id}
                      to={`/panel-de-control/reservas/${reservation.id}`}
                    >
                      <div>
                        <strong>{reservation.locator}</strong>
                        <small>{reservation.sellerAgencyName}</small>
                      </div>
                      <div>
                        <strong>{reservation.productName}</strong>
                        <small>{reservation.city || "Sin ciudad"}</small>
                      </div>
                      <div>
                        <strong>{formatDateTimeDatePart(reservation.createdAt)}</strong>
                        <small>
                          {new Intl.DateTimeFormat("es-CO", {
                            hour: "numeric",
                            minute: "2-digit",
                          }).format(new Date(reservation.createdAt))}
                        </small>
                      </div>
                      <div>
                        <strong>{formatDate(reservation.travelDate)}</strong>
                        <small>{reservation.embarkTime || "Por definir"}</small>
                      </div>
                      <div>
                        <strong>
                          {reservation.expiresAt
                            ? formatDateTimeDatePart(reservation.expiresAt)
                            : "No aplica"}
                        </strong>
                        <small>
                          {reservation.expiresAt
                            ? new Intl.DateTimeFormat("es-CO", {
                                hour: "numeric",
                                minute: "2-digit",
                              }).format(new Date(reservation.expiresAt))
                            : "Sin vencimiento"}
                        </small>
                      </div>
                      <div>
                        <strong>{formatCurrency(reservation.totalAmount)}</strong>
                        <small>{reservation.paymentType || "Sin pago"}</small>
                      </div>
                      <div>
                        <strong>{formatStatusLabel(reservation.status)}</strong>
                        <small>{reservation.createdByName}</small>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </section>
        </div>
      </main>

      <Footer data={footerData} />

      {isCreateModalOpen ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={closeCreateModal}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal panel-control-reservations-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-control-create-reservation-title"
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={closeCreateModal}
              aria-label="Cerrar creacion de reserva"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Reserva manual</p>
            <h3 id="panel-control-create-reservation-title">Crear reserva base</h3>
            <span>
              Este formulario crea una reserva real en Supabase y la deja lista
              para alimentar el calendario del producto.
            </span>

            <form
              className="panel-control-calendar-modal-form panel-control-reservations-form"
              onSubmit={handleCreateReservation}
            >
              <label>
                <span>Producto</span>
                <select
                  value={reservationForm.productId}
                  onChange={(event) => handleProductChange(event.target.value)}
                >
                  <option value="">Selecciona un producto</option>
                  {productOptions.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title} - {product.city || "Sin ciudad"}
                    </option>
                  ))}
                </select>
              </label>

              <div className="panel-control-reservations-form-grid">
                <label>
                  <span>Fecha de viaje</span>
                  <input
                    type="date"
                    value={reservationForm.travelDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        travelDate: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span>Estado inicial</span>
                  <select
                    value={reservationForm.status}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                  >
                    <option value="reserved">Reservado</option>
                    <option value="issued">Emitida</option>
                  </select>
                </label>
              </div>

              <div className="panel-control-reservations-form-grid">
                <label>
                  <span>Tipo de pago</span>
                  <select
                    value={reservationForm.paymentType}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        paymentType: event.target.value,
                      }))
                    }
                  >
                    <option value="transferencia">Transferencia</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="credito">Credito</option>
                  </select>
                </label>

                <label>
                  <span>Valor total</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={reservationForm.totalAmount}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        totalAmount: event.target.value,
                      }))
                    }
                    placeholder="Ejemplo: 250000"
                  />
                </label>
              </div>

              <label>
                <span>Resumen / notas</span>
                <textarea
                  value={reservationForm.notesSummary}
                  onChange={(event) =>
                    setReservationForm((current) => ({
                      ...current,
                      notesSummary: event.target.value,
                    }))
                  }
                  placeholder="Observacion comercial corta para esta reserva"
                />
              </label>

              <div className="panel-control-reservations-passengers">
                <div className="panel-control-reservations-passengers-head">
                  <strong>Pasajeros</strong>
                  <button type="button" onClick={addPassenger}>
                    Agregar pasajero
                  </button>
                </div>

                {reservationForm.passengers.map((passenger, index) => (
                  <div
                    className="panel-control-reservations-passenger-row"
                    key={passenger.id}
                  >
                    <label>
                      <span>Nombre</span>
                      <input
                        type="text"
                        value={passenger.firstName}
                        onChange={(event) =>
                          updatePassenger(passenger.id, "firstName", event.target.value)
                        }
                        placeholder={`Pasajero ${index + 1}`}
                      />
                    </label>

                    <label>
                      <span>Apellido</span>
                      <input
                        type="text"
                        value={passenger.lastName}
                        onChange={(event) =>
                          updatePassenger(passenger.id, "lastName", event.target.value)
                        }
                        placeholder="Apellido"
                      />
                    </label>

                    <label>
                      <span>Tipo</span>
                      <select
                        value={passenger.passengerType}
                        onChange={(event) =>
                          updatePassenger(
                            passenger.id,
                            "passengerType",
                            event.target.value,
                          )
                        }
                      >
                        <option value="ADT">ADT</option>
                        <option value="CHD">CHD</option>
                        <option value="INF">INF</option>
                      </select>
                    </label>

                    <button
                      type="button"
                      className="panel-control-reservations-passenger-remove"
                      onClick={() => removePassenger(passenger.id)}
                      disabled={reservationForm.passengers.length === 1}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>

              {createError ? (
                <p className="panel-control-calendar-modal-error">{createError}</p>
              ) : null}

              {capacityRequestNotice ? (
                <p className="panel-control-reservations-capacity-request-notice">
                  {capacityRequestNotice}
                </p>
              ) : null}

              {capacityRequestContext ? (
                <div className="panel-control-reservations-capacity-request">
                  <strong>Solicitar ampliacion de cupo</strong>
                  <p>
                    Esta reserva necesita {capacityRequestContext.requestedPassengerCount} cupos
                    y hoy solo quedan {capacityRequestContext.currentAvailableCapacity}.
                    Puedes registrar una solicitud previa sin reserva para que la
                    agencia proveedora revise la ampliacion.
                  </p>
                  <button
                    type="button"
                    className="detalle-producto-admin-modal-button"
                    onClick={handleCreateCapacityRequest}
                    disabled={isSubmittingCapacityRequest || isCreatingReservation}
                  >
                    {isSubmittingCapacityRequest
                      ? "Registrando solicitud..."
                      : "Solicitar ampliacion"}
                  </button>
                </div>
              ) : null}

              <div className="detalle-producto-admin-modal-actions">
                <button
                  type="button"
                  className="detalle-producto-admin-modal-button detalle-producto-admin-modal-button--secondary"
                  onClick={closeCreateModal}
                  disabled={isCreatingReservation}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="detalle-producto-admin-modal-button"
                  disabled={isCreatingReservation}
                >
                  {isCreatingReservation ? "Creando..." : "Crear reserva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {capacityDecisionModal?.request ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={closeCapacityDecisionModal}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal panel-control-reservations-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-control-capacity-decision-title"
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={closeCapacityDecisionModal}
              aria-label="Cerrar decision de solicitud"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Solicitud de ampliacion</p>
            <h3 id="panel-control-capacity-decision-title">
              {capacityDecisionModal.action === "approve"
                ? "Aprobar y ampliar cupo"
                : "Rechazar solicitud"}
            </h3>
            <span>
              {capacityDecisionModal.request.productName} -{" "}
              {formatDate(capacityDecisionModal.request.travelDate)}
            </span>

            <div className="panel-control-capacity-decision-summary">
              <div>
                <span>Agencia solicitante</span>
                <strong>{capacityDecisionModal.request.sellerAgencyName}</strong>
              </div>
              <div>
                <span>Capacidad actual</span>
                <strong>
                  {capacityDecisionModal.request.occupiedPassengers}/
                  {capacityDecisionModal.request.effectiveCapacity}
                </strong>
              </div>
              <div>
                <span>Disponibles hoy</span>
                <strong>{capacityDecisionModal.request.availableCapacity}</strong>
              </div>
              <div>
                <span>Solicitud</span>
                <strong>
                  {capacityDecisionModal.request.requestedPassengerCount} pasajeros
                </strong>
              </div>
            </div>

            {capacityDecisionModal.request.reason ? (
              <div className="panel-control-capacity-decision-reason">
                <strong>Motivo informado</strong>
                <p>{capacityDecisionModal.request.reason}</p>
              </div>
            ) : null}

            <form
              className="panel-control-calendar-modal-form panel-control-reservations-form"
              onSubmit={handleSubmitCapacityDecision}
            >
              {capacityDecisionModal.action === "approve" ? (
                <label>
                  <span>Cupo total para esa fecha</span>
                  <input
                    type="number"
                    min={capacityDecisionModal.request.suggestedCapacity}
                    step="1"
                    value={capacityDecisionForm.capacity}
                    onChange={(event) =>
                      setCapacityDecisionForm((current) => ({
                        ...current,
                        capacity: event.target.value,
                      }))
                    }
                    placeholder={`Minimo recomendado: ${capacityDecisionModal.request.suggestedCapacity}`}
                  />
                </label>
              ) : null}

              <label>
                <span>
                  {capacityDecisionModal.action === "approve"
                    ? "Nota interna / respuesta"
                    : "Motivo del rechazo"}
                </span>
                <textarea
                  value={capacityDecisionForm.resolutionNotes}
                  onChange={(event) =>
                    setCapacityDecisionForm((current) => ({
                      ...current,
                      resolutionNotes: event.target.value,
                    }))
                  }
                  placeholder={
                    capacityDecisionModal.action === "approve"
                      ? "Ejemplo: se amplio el cupo para absorber la solicitud."
                      : "Explica por que no se puede ampliar la fecha."
                  }
                />
              </label>

              {capacityDecisionError ? (
                <p className="panel-control-calendar-modal-error">
                  {capacityDecisionError}
                </p>
              ) : null}

              <div className="detalle-producto-admin-modal-actions">
                <button
                  type="button"
                  className="detalle-producto-admin-modal-button detalle-producto-admin-modal-button--secondary"
                  onClick={closeCapacityDecisionModal}
                  disabled={isSubmittingCapacityDecision}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="detalle-producto-admin-modal-button"
                  disabled={isSubmittingCapacityDecision}
                >
                  {isSubmittingCapacityDecision
                    ? "Guardando..."
                    : capacityDecisionModal.action === "approve"
                      ? "Aprobar solicitud"
                      : "Rechazar solicitud"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isCapacityRequestsModalOpen ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={() => setIsCapacityRequestsModalOpen(false)}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal panel-control-reservations-modal panel-control-capacity-requests-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-control-capacity-requests-modal-title"
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={() => setIsCapacityRequestsModalOpen(false)}
              aria-label="Cerrar solicitudes de ampliacion"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Solicitudes de ampliacion</p>
            <h3 id="panel-control-capacity-requests-modal-title">
              Fechas y productos con solicitud de cupo
            </h3>
            <span>
              Revisa rapidamente que productos y fechas tienen solicitudes pendientes
              o ya gestionadas dentro de LDS.
            </span>

            {isLoadingCapacityRequests ? (
              <div className="panel-control-reservations-empty">
                <LoadingState
                  title="Cargando solicitudes"
                  description="Estamos preparando el resumen de ampliaciones para esta vista."
                />
              </div>
            ) : capacityRequestsLoadError ? (
              <div className="panel-control-reservations-empty">
                <strong>No pudimos cargar las solicitudes.</strong>
                <p>{capacityRequestsLoadError}</p>
              </div>
            ) : capacityRequests.length === 0 ? (
              <div className="panel-control-reservations-empty">
                <strong>No hay solicitudes registradas.</strong>
                <p>
                  Cuando una agencia solicite ampliacion de cupo, la veras aqui.
                </p>
              </div>
            ) : (
              <div className="panel-control-capacity-requests-modal-list">
                {capacityRequests.map((request) => (
                  <article
                    className="panel-control-capacity-requests-modal-item"
                    key={request.id}
                  >
                    <div>
                      <strong>{request.productName}</strong>
                      <small>{formatDate(request.travelDate)}</small>
                    </div>
                    <div>
                      <strong>{request.sellerAgencyName}</strong>
                      <small>{request.requestedByName}</small>
                    </div>
                    <div>
                      <strong>{formatCapacityRequestStatusLabel(request.status)}</strong>
                      <small>
                        Solicita {request.requestedPassengerCount} pasajero
                        {request.requestedPassengerCount === 1 ? "" : "s"}
                      </small>
                    </div>
                    {request.status === "pending" && request.canReview ? (
                      <div className="panel-control-capacity-requests-actions panel-control-capacity-requests-modal-actions">
                        <button
                          type="button"
                          className="panel-control-capacity-requests-action"
                          onClick={() => openCapacityDecisionModal(request, "approve")}
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          className="panel-control-capacity-requests-action panel-control-capacity-requests-action--secondary"
                          onClick={() => openCapacityDecisionModal(request, "reject")}
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
