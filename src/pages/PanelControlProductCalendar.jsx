import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

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
  createProductActiveRangeInSupabase,
  deactivateProductCalendarDateInSupabase,
  fetchProductCalendarMonthFromSupabase,
  reactivateProductCalendarDateInSupabase,
} from "../services/products/adminCalendar";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

function createMonthCursor(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
}

function normalizeDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createLocalDateFromInput(dateValue) {
  const [year, month, day] = String(dateValue ?? "").split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatCalendarDate(dateValue, options = {}) {
  const parsedDate = createLocalDateFromInput(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("es-CO", options).format(parsedDate);
}

function formatDateTimeLabel(value) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
}

function getCalendarEventTitle(event) {
  switch (event?.eventType) {
    case "initial_range_created":
      return "Rango inicial creado";
    case "active_range_created":
      return "Nuevo rango activo";
    case "product_activated":
      return "Producto activado";
    case "date_deactivated":
      return "Fecha inactivada";
    case "date_reactivated":
      return "Fecha reactivada";
    case "date_deactivation_blocked":
      return "Cierre bloqueado";
    default:
      return "Movimiento del calendario";
  }
}

function getCalendarEventSummary(event) {
  if (event?.targetDate) {
    return formatCalendarDate(event.targetDate, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (event?.rangeStart && event?.rangeEnd) {
    return `Del ${formatCalendarDate(event.rangeStart, {
      day: "numeric",
      month: "short",
    })} al ${formatCalendarDate(event.rangeEnd, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  }

  return "";
}

function formatTimeLabel(value) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return "Por definir";
  }

  const matchedValue = normalizedValue.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);

  if (!matchedValue) {
    return normalizedValue;
  }

  const hours24 = Number(matchedValue[1]);
  const minutes = matchedValue[2];
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${minutes} ${meridiem}`;
}

function getGridLeadingEmptyDays(days = []) {
  const firstDay = days[0];

  if (!firstDay) {
    return [];
  }

  const weekdayIndex = Number(firstDay.weekday ?? 0);
  const mondayFirstIndex = weekdayIndex === 0 ? 6 : weekdayIndex - 1;

  return Array.from({ length: mondayFirstIndex }, (_, index) => `empty-${index}`);
}

function buildMonthNavigation(date, direction) {
  return new Date(date.getFullYear(), date.getMonth() + direction, 1, 12, 0, 0, 0);
}

function createInitialRangeFormState() {
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);

  return {
    startDate: normalizeDateInputValue(todayDate),
    endDate: normalizeDateInputValue(todayDate),
    capacity: "20",
  };
}

export default function PanelControlProductCalendarPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [monthCursor, setMonthCursor] = useState(() => createMonthCursor());
  const [calendarPayload, setCalendarPayload] = useState(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);
  const [calendarLoadError, setCalendarLoadError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDateReason, setSelectedDateReason] = useState("");
  const [isInitialRangeModalOpen, setIsInitialRangeModalOpen] = useState(false);
  const [isSeasonRangesModalOpen, setIsSeasonRangesModalOpen] = useState(false);
  const [initialRangeForm, setInitialRangeForm] = useState(() =>
    createInitialRangeFormState(),
  );
  const [initialRangeError, setInitialRangeError] = useState("");
  const [isSavingInitialRange, setIsSavingInitialRange] = useState(false);
  const [isUpdatingCalendarDate, setIsUpdatingCalendarDate] = useState(false);
  const activationRequestedFromDetail = searchParams.get("activation") === "1";

  const refreshCalendar = useCallback(
    async ({ preserveSelectedDate = true } = {}) => {
      setIsLoadingCalendar(true);
      setCalendarLoadError("");

      try {
        const nextPayload = await fetchProductCalendarMonthFromSupabase({
          productId,
          year: monthCursor.getFullYear(),
          month: monthCursor.getMonth() + 1,
        });

        setCalendarPayload(nextPayload);

        if (!nextPayload) {
          setSelectedDate("");
          return;
        }

        setIsInitialRangeModalOpen(nextPayload.requiresInitialRange);
        setSelectedDate((current) => {
          const availableDates = nextPayload.days.map((day) => day.date);

          if (preserveSelectedDate && current && availableDates.includes(current)) {
            return current;
          }

          return availableDates[0] ?? "";
        });
      } catch (error) {
        setCalendarPayload(null);
        setCalendarLoadError(
          error?.message ||
            "No fue posible cargar el calendario operativo del producto.",
        );
      } finally {
        setIsLoadingCalendar(false);
      }
    },
    [activationRequestedFromDetail, monthCursor, productId],
  );

  useEffect(() => {
    refreshCalendar();
  }, [refreshCalendar]);

  const currentMonthDays = calendarPayload?.days ?? [];
  const selectedDay =
    currentMonthDays.find((day) => day.date === selectedDate) ?? currentMonthDays[0] ?? null;
  const gridLeadingEmptyDays = useMemo(
    () => getGridLeadingEmptyDays(currentMonthDays),
    [currentMonthDays],
  );
  const monthGridItems = useMemo(
    () => [...gridLeadingEmptyDays, ...currentMonthDays],
    [currentMonthDays, gridLeadingEmptyDays],
  );
  const currentProduct = calendarPayload?.product ?? null;
  const summary = calendarPayload?.summary ?? null;
  const activeRangeCards = calendarPayload?.activeRanges ?? [];
  const seasonRangeCards = calendarPayload?.seasonRanges ?? [];
  const activation = calendarPayload?.activation ?? null;
  const calendarHistory = calendarPayload?.history ?? [];
  const selectedDateHistory = useMemo(
    () =>
      calendarHistory.filter(
        (event) => event.targetDate && event.targetDate === selectedDay?.date,
      ),
    [calendarHistory, selectedDay?.date],
  );

  useEffect(() => {
    if (!selectedDay) {
      setSelectedDateReason("");
      return;
    }

    setSelectedDateReason(selectedDay.blockedReason || "");
  }, [selectedDay]);

  function goToPreviousMonth() {
    setMonthCursor((current) => buildMonthNavigation(current, -1));
  }

  function goToNextMonth() {
    setMonthCursor((current) => buildMonthNavigation(current, 1));
  }

  async function handleCreateInitialRange(event) {
    event.preventDefault();
    setInitialRangeError("");

    try {
      setIsSavingInitialRange(true);
      await createProductActiveRangeInSupabase({
        productId,
        startDate: initialRangeForm.startDate,
        endDate: initialRangeForm.endDate,
        capacity: initialRangeForm.capacity,
      });
      setIsInitialRangeModalOpen(false);
      setInitialRangeForm(createInitialRangeFormState());
      if (activationRequestedFromDetail) {
        setSearchParams({}, { replace: true });
      }
      await refreshCalendar({ preserveSelectedDate: false });
    } catch (error) {
      setInitialRangeError(
        error?.message ||
          "No fue posible guardar el rango activo inicial del producto.",
      );
    } finally {
      setIsSavingInitialRange(false);
    }
  }

  async function handleDeactivateSelectedDay() {
    if (!selectedDay?.date || isUpdatingCalendarDate) {
      return;
    }

    try {
      setIsUpdatingCalendarDate(true);
      await deactivateProductCalendarDateInSupabase({
        productId,
        date: selectedDay.date,
        reason: selectedDateReason,
      });
      await refreshCalendar();
    } catch (error) {
      window.alert(
        error?.message || "No fue posible inactivar la fecha seleccionada.",
      );
    } finally {
      setIsUpdatingCalendarDate(false);
    }
  }

  async function handleReactivateSelectedDay() {
    if (!selectedDay?.date || isUpdatingCalendarDate) {
      return;
    }

    try {
      setIsUpdatingCalendarDate(true);
      await reactivateProductCalendarDateInSupabase({
        productId,
        date: selectedDay.date,
      });
      await refreshCalendar();
    } catch (error) {
      window.alert(
        error?.message || "No fue posible reactivar la fecha seleccionada.",
      );
    } finally {
      setIsUpdatingCalendarDate(false);
    }
  }

  return (
    <div className="panel-control-page">
      <PrimaryHeader />

      <main className="panel-control-main">
        <div className="panel-control-layout">
          <DashboardSidebar menu={panelControlMenu} profile={panelControlProfile} />

          <section className="panel-control-content panel-control-calendar-page">
            <header className="panel-control-calendar-hero panel-control-card">
              <div className="panel-control-calendar-hero-copy">
                <p>Calendario operativo</p>
                <h1>
                  {currentProduct?.title ?? "Calendario del producto"}
                </h1>

                {currentProduct ? (
                  <div className="panel-control-calendar-hero-meta">
                    <div>
                      <span>Ciudad</span>
                      <strong>{currentProduct.city || "Por definir"}</strong>
                    </div>
                    <div>
                      <span>Punto de encuentro</span>
                      <strong>{currentProduct.departurePoint || "Por definir"}</strong>
                    </div>
                    <div>
                      <span>Hora de salida</span>
                      <strong>{formatTimeLabel(currentProduct.departureTime)}</strong>
                    </div>
                    <div>
                      <span>Hora de llegada</span>
                      <strong>{formatTimeLabel(currentProduct.returnTime)}</strong>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="panel-control-calendar-hero-actions">
                <button
                  type="button"
                  className="panel-control-products-create panel-control-calendar-secondary"
                  onClick={() => setIsSeasonRangesModalOpen(true)}
                  disabled={seasonRangeCards.length === 0}
                >
                  {seasonRangeCards.length > 0
                    ? `Temporadas altas (${seasonRangeCards.length})`
                    : "Sin temporadas altas"}
                </button>
                <button
                  type="button"
                  className="panel-control-products-create panel-control-calendar-back-button"
                  onClick={() => navigate(`/panel-de-control/productos/${productId}`)}
                >
                  Volver a la ficha
                </button>
              </div>
            </header>

            {isLoadingCalendar && !calendarPayload ? (
              <section className="panel-control-card panel-control-calendar-loading">
                <LoadingState
                  className="panel-calendar-loading-state"
                  title="Cargando calendario operativo"
                  description="Estamos consultando rangos activos, fechas operables y temporadas del producto."
                />
              </section>
            ) : !calendarPayload ? (
              <section className="panel-control-card panel-control-calendar-empty">
                <strong>No pudimos abrir el calendario.</strong>
                <p>
                  {calendarLoadError ||
                    "El producto no existe en Supabase o no tienes acceso a este calendario."}
                </p>
                <Link
                  className="detalle-producto-unavailable-button"
                  to="/panel-de-control/productos"
                >
                  Volver a productos
                </Link>
              </section>
            ) : (
              <>
                {activation ? (
                  <section
                    className={`panel-control-card panel-control-calendar-activation-banner panel-control-calendar-activation-banner--${activation.tone}`}
                  >
                    <div className="panel-control-calendar-activation-banner-copy">
                      <span>
                        {activationRequestedFromDetail
                          ? "Activacion guiada"
                          : "Estado de activacion"}
                      </span>
                      <strong>{activation.title}</strong>
                      <p>{activation.description}</p>
                    </div>

                    <div className="panel-control-calendar-activation-banner-actions">
                      {activation.nextActiveRange?.fecha_inicio ? (
                        <small>
                          Proxima ventana:{" "}
                          {formatCalendarDate(activation.nextActiveRange.fecha_inicio, {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          al{" "}
                          {formatCalendarDate(activation.nextActiveRange.fecha_fin, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </small>
                      ) : (
                        <small>
                          Cuando guardes un rango activo, el producto podra volver a
                          operar en esas fechas.
                        </small>
                      )}
                    </div>
                  </section>
                ) : null}

                <section className="panel-control-calendar-summary-grid">
                  <article className="panel-control-products-overview-card">
                    <span>Rangos activos</span>
                    <strong>{summary?.activeRangesCount ?? 0}</strong>
                    <p>Segmentos vigentes que hoy habilitan operacion por fecha.</p>
                  </article>

                  <article className="panel-control-products-overview-card">
                    <span>Fechas no operables</span>
                    <strong>{summary?.inactiveDatesCount ?? 0}</strong>
                    <p>Dias del mes actual que hoy no estan habilitados para operar.</p>
                  </article>

                  <article className="panel-control-products-overview-card">
                    <span>Dias en temporada alta</span>
                    <strong>{summary?.highSeasonDaysCount ?? 0}</strong>
                    <p>Fechas marcadas como temporada alta en el mes visible.</p>
                  </article>

                  <article className="panel-control-products-overview-card">
                    <span>Dias con reservas</span>
                    <strong>{summary?.reservedDaysCount ?? 0}</strong>
                    <p>Fechas con reservas activas detectadas en este mes.</p>
                  </article>
                </section>

                <section className="panel-control-calendar-layout">
                  <div className="panel-control-card panel-control-calendar-board">
                    <div className="panel-control-calendar-board-head">
                      <div>
                        <p>Vista mensual</p>
                        <h2>{calendarPayload.month.monthLabel}</h2>
                      </div>

                      <div className="panel-control-calendar-nav">
                        <button type="button" onClick={goToPreviousMonth}>
                          <span className="material-icons-outlined">chevron_left</span>
                        </button>
                        <button type="button" onClick={goToNextMonth}>
                          <span className="material-icons-outlined">chevron_right</span>
                        </button>
                      </div>
                    </div>

                    <div className="panel-control-calendar-legend">
                      <span className="panel-control-calendar-legend-item">
                        <i className="panel-control-calendar-legend-dot panel-control-calendar-legend-dot--available" />
                        Disponible
                      </span>
                      <span className="panel-control-calendar-legend-item">
                        <i className="panel-control-calendar-legend-dot panel-control-calendar-legend-dot--reserved" />
                        Con reservas
                      </span>
                      <span className="panel-control-calendar-legend-item">
                        <i className="panel-control-calendar-legend-dot panel-control-calendar-legend-dot--blocked" />
                        No operable
                      </span>
                      <span className="panel-control-calendar-legend-item">
                        <i className="panel-control-calendar-legend-dot panel-control-calendar-legend-dot--season" />
                        Temporada alta
                      </span>
                    </div>

                    <div className="panel-control-calendar-weekdays">
                      {WEEKDAY_LABELS.map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                    </div>

                    <div className="panel-control-calendar-grid">
                      {monthGridItems.map((entry) => {
                        if (typeof entry === "string") {
                          return <div className="panel-control-calendar-empty-cell" key={entry} />;
                        }

                        const isSelected = selectedDay?.date === entry.date;
                        const classNames = [
                          "panel-control-calendar-day",
                          isSelected ? "panel-control-calendar-day--selected" : "",
                          !entry.isWithinActiveRange
                            ? "panel-control-calendar-day--out-of-range"
                            : entry.isOperable
                              ? entry.occupancyPercentage > 0
                                ? "panel-control-calendar-day--reserved"
                                : "panel-control-calendar-day--available"
                              : "panel-control-calendar-day--blocked",
                          entry.isHighSeason
                            ? "panel-control-calendar-day--high-season"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ");
                        const occupancyTone = Math.max(
                          0,
                          Math.min(1, Number(entry.occupancyPercentage ?? 0) / 100),
                        );

                        return (
                          <button
                            type="button"
                            className={classNames}
                            key={entry.date}
                            onClick={() => setSelectedDate(entry.date)}
                            style={{
                              "--lds-calendar-occupancy-strength": occupancyTone,
                            }}
                          >
                            <span className="panel-control-calendar-day-head">
                              <span className="panel-control-calendar-day-number">
                                {entry.dayNumber}
                              </span>
                            </span>
                            <span className="panel-control-calendar-day-meta">
                              {entry.occupancyPercentage > 0
                                ? `${entry.occupiedPassengers}/${entry.effectiveCapacity} cupos`
                                : entry.isWithinActiveRange
                                  ? entry.isOperable
                                    ? "Operable"
                                    : "Inactivo"
                                  : "Fuera de rango"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <aside className="panel-control-card panel-control-calendar-sidebar">
                    {selectedDay ? (
                      <>
                        <div className="panel-control-calendar-sidebar-head">
                          <p>Fecha seleccionada</p>
                          <h3>
                            {formatCalendarDate(selectedDay.date, {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </h3>
                        </div>

                        <div className="panel-control-calendar-sidebar-statuses">
                          <span className="panel-control-calendar-status-chip">
                            {selectedDay.isWithinActiveRange
                              ? "Dentro del rango activo"
                              : "Fuera del rango activo"}
                          </span>
                          <span className="panel-control-calendar-status-chip">
                            {selectedDay.isOperable ? "Operable" : "No operable"}
                          </span>
                          {selectedDay.isHighSeason ? (
                            <span className="panel-control-calendar-status-chip panel-control-calendar-status-chip--season">
                              Temporada alta
                            </span>
                          ) : null}
                          {selectedDay.hasActiveReservations ? (
                            <span className="panel-control-calendar-status-chip">
                              {selectedDay.reservationCount} reservas activas
                            </span>
                          ) : null}
                          {selectedDay.occupancyPercentage > 0 ? (
                            <span className="panel-control-calendar-status-chip">
                              {selectedDay.occupiedPassengers}/{selectedDay.effectiveCapacity} cupos usados
                            </span>
                          ) : null}
                          {selectedDay.effectiveCapacity > 0 ? (
                            <span className="panel-control-calendar-status-chip panel-control-calendar-status-chip--groups">
                              {selectedDay.availableCapacity} cupos disponibles
                            </span>
                          ) : null}
                        </div>

                        {selectedDay.canDeactivate ? (
                          <div className="panel-control-calendar-action-card">
                            <div className="panel-control-calendar-action-card-head">
                              <strong>Inactivar fecha</strong>
                            </div>

                            <span className="panel-control-calendar-action-card-copy">
                              Cierra esta fecha de forma manual y deja trazado el motivo operativo.
                            </span>

                            <div className="panel-control-calendar-sidebar-form">
                              <label>
                                <span>Motivo del cierre</span>
                                <textarea
                                  value={selectedDateReason}
                                  onChange={(event) =>
                                    setSelectedDateReason(event.target.value)
                                  }
                                  placeholder="Ejemplo: mantenimiento, clima, operacion especial"
                                />
                              </label>

                              <button
                                type="button"
                                className="panel-control-products-create panel-control-calendar-danger"
                                onClick={handleDeactivateSelectedDay}
                                disabled={isUpdatingCalendarDate}
                              >
                                {isUpdatingCalendarDate ? "Guardando..." : "Inactivar fecha"}
                              </button>
                            </div>
                          </div>
                        ) : selectedDay.canReactivate ? (
                          <div className="panel-control-calendar-action-card panel-control-calendar-action-card--reactivate">
                            <div className="panel-control-calendar-action-card-head">
                              <strong>Reactivar fecha</strong>
                            </div>

                            <span className="panel-control-calendar-action-card-copy">
                              Vuelve a habilitar esta fecha dentro del rango activo del producto.
                            </span>

                            <button
                              type="button"
                              className="panel-control-products-create"
                              onClick={handleReactivateSelectedDay}
                              disabled={isUpdatingCalendarDate}
                            >
                              {isUpdatingCalendarDate ? "Guardando..." : "Reactivar fecha"}
                            </button>
                          </div>
                        ) : selectedDay.hasBlockingReservations ? (
                          <div className="panel-control-calendar-sidebar-alert">
                            <strong>Fecha protegida</strong>
                            <p>
                              Esta fecha no puede inactivarse porque tiene reservas
                              activas asociadas.
                            </p>
                          </div>
                        ) : null}

                        <div className="panel-control-calendar-ranges">
                          <strong>Rangos activos cargados</strong>
                          {activeRangeCards.length > 0 ? (
                            <div className="panel-control-calendar-ranges-list">
                              {activeRangeCards.map((range) => (
                                <article
                                  className="panel-control-calendar-range-card"
                                  key={range.id}
                                >
                                  <span>
                                    Del{" "}
                                    {formatCalendarDate(range.fecha_inicio, {
                                      day: "numeric",
                                      month: "short",
                                    })}{" "}
                                    al{" "}
                                    {formatCalendarDate(range.fecha_fin, {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                </article>
                              ))}
                            </div>
                          ) : (
                            <p>
                              Este producto todavia no tiene rangos activos guardados.
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="panel-control-calendar-empty">
                        <strong>No hay una fecha seleccionada.</strong>
                      </div>
                    )}
                  </aside>
                </section>

                <section className="panel-control-card panel-control-calendar-history-section">
                  <div className="panel-control-calendar-history-section-head">
                    <p>Historial de la fecha</p>
                    <h3>
                      {selectedDay
                        ? `Movimientos del ${formatCalendarDate(selectedDay.date, {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}`
                        : "Selecciona una fecha para ver sus movimientos"}
                    </h3>
                  </div>

                  {selectedDay && selectedDateHistory.length > 0 ? (
                    <>
                      <div className="panel-control-calendar-history-table-head">
                        <span>Movimiento</span>
                        <span>Responsable</span>
                        <span>Motivo / detalle</span>
                        <span>Fecha</span>
                      </div>

                      <div className="panel-control-calendar-history-list panel-control-calendar-history-list--horizontal">
                        {selectedDateHistory.map((event) => (
                          <article
                            className="panel-control-calendar-history-card"
                            key={event.id}
                          >
                            <div className="panel-control-calendar-history-card-head">
                              <strong>{getCalendarEventTitle(event)}</strong>
                              {getCalendarEventSummary(event) ? (
                                <small>{getCalendarEventSummary(event)}</small>
                              ) : null}
                            </div>

                            <div className="panel-control-calendar-history-card-meta">
                              <span>{event.actorName}</span>
                              {event.reason ? (
                                <p>{event.reason}</p>
                              ) : (
                                <p>Sin observacion adicional.</p>
                              )}
                              <time dateTime={event.createdAt}>
                                {formatDateTimeLabel(event.createdAt)}
                              </time>
                            </div>
                          </article>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="panel-control-calendar-empty">
                      <strong>
                        {selectedDay
                          ? "No hay movimientos registrados para esta fecha."
                          : "Selecciona una fecha para revisar su historial."}
                      </strong>
                    </div>
                  )}
                </section>
              </>
            )}
          </section>
        </div>
      </main>

      <Footer data={footerData} />

      {isInitialRangeModalOpen && currentProduct ? (
        <div className="detalle-producto-admin-modal-backdrop" role="presentation">
          <div
            className="detalle-producto-admin-modal panel-control-calendar-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-control-calendar-initial-range-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p>Activacion inicial</p>
            <h3 id="panel-control-calendar-initial-range-title">
              Configura fechas activas y cupos base
            </h3>
            <span>
              Antes de usar el calendario de <strong>{currentProduct.title}</strong>,
              define el rango de operacion y el cupo base para cada fecha
              habilitada. Este paso tambien activara el producto dentro del
              catalogo administrativo.
            </span>

            <form
              className="panel-control-calendar-modal-form"
              onSubmit={handleCreateInitialRange}
            >
              <label>
                <span>Fecha inicial</span>
                <input
                  type="date"
                  value={initialRangeForm.startDate}
                  min={normalizeDateInputValue(new Date())}
                  max={`${new Date().getFullYear()}-12-31`}
                  onChange={(event) =>
                    setInitialRangeForm((current) => ({
                      ...current,
                      startDate: event.target.value,
                      endDate:
                        current.endDate < event.target.value
                          ? event.target.value
                          : current.endDate,
                    }))
                  }
                />
              </label>

              <label>
                <span>Fecha final</span>
                <input
                  type="date"
                  value={initialRangeForm.endDate}
                  min={initialRangeForm.startDate}
                  max={`${new Date().getFullYear() + 1}-01-31`}
                  onChange={(event) =>
                    setInitialRangeForm((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Cupo base por fecha</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={initialRangeForm.capacity}
                  onChange={(event) =>
                    setInitialRangeForm((current) => ({
                      ...current,
                      capacity: event.target.value,
                    }))
                  }
                />
              </label>

              {initialRangeError ? (
                <p className="panel-control-calendar-modal-error">
                  {initialRangeError}
                </p>
              ) : null}

              <div className="detalle-producto-admin-modal-actions">
                <button
                  type="button"
                  className="detalle-producto-admin-modal-button detalle-producto-admin-modal-button--secondary"
                  onClick={() => navigate(`/panel-de-control/productos/${productId}`)}
                  disabled={isSavingInitialRange}
                >
                  Volver a la ficha
                </button>
                <button
                  type="submit"
                  className="detalle-producto-admin-modal-button"
                  disabled={isSavingInitialRange}
                >
                  {isSavingInitialRange
                    ? "Activando..."
                    : "Activar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isSeasonRangesModalOpen ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={() => setIsSeasonRangesModalOpen(false)}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal panel-control-calendar-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-control-calendar-season-ranges-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={() => setIsSeasonRangesModalOpen(false)}
              aria-label="Cerrar temporadas altas"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Temporadas altas</p>
            <h3 id="panel-control-calendar-season-ranges-title">
              Fechas futuras del producto
            </h3>
            <span>
              Estos son los periodos de temporada alta que siguen vigentes para{" "}
              <strong>{currentProduct?.title || "este producto"}</strong>.
            </span>

            {seasonRangeCards.length > 0 ? (
              <div className="panel-control-calendar-ranges-list panel-control-calendar-ranges-list--modal">
                {seasonRangeCards.map((range) => (
                  <article
                    className="panel-control-calendar-range-card panel-control-calendar-range-card--season"
                    key={range.id}
                  >
                    <span>{range.nombre_opcional || "Temporada alta"}</span>
                    <small>
                      Del{" "}
                      {formatCalendarDate(range.fecha_inicio, {
                        day: "numeric",
                        month: "long",
                      })}{" "}
                      al{" "}
                      {formatCalendarDate(range.fecha_fin, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </small>
                  </article>
                ))}
              </div>
            ) : (
              <div className="panel-control-calendar-empty">
                <strong>No hay temporadas altas futuras cargadas.</strong>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
