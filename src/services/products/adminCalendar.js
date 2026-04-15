import { supabase } from "../../lib/supabase/client.js";
import { normalizeProductId } from "../../utils/productIds.js";
import { updateProductStatusInSupabase } from "./adminMutations.js";

const ACTIVE_RESERVATION_STATUSES = [
  "reserved",
  "issued",
  "refund_in_progress",
];

const PRODUCT_CALENDAR_EVENT_TYPES = {
  INITIAL_RANGE_CREATED: "initial_range_created",
  ACTIVE_RANGE_CREATED: "active_range_created",
  PRODUCT_ACTIVATED: "product_activated",
  DATE_DEACTIVATED: "date_deactivated",
  DATE_REACTIVATED: "date_reactivated",
  DATE_DEACTIVATION_BLOCKED: "date_deactivation_blocked",
};

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function createLocalDate(year, monthIndex, day = 1) {
  return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey ?? "").trim())) {
    return null;
  }

  const [year, month, day] = String(dateKey).split("-").map(Number);
  return createLocalDate(year, month - 1, day);
}

function parseCapacityValue(value) {
  const parsedValue = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsedValue) ? parsedValue : NaN;
}

function validateCapacityValue(value) {
  const normalizedCapacity = parseCapacityValue(value);

  if (!Number.isInteger(normalizedCapacity) || normalizedCapacity <= 0) {
    throw new Error("Debes indicar un cupo maximo por fecha valido.");
  }

  return normalizedCapacity;
}

function getMonthBounds(year, month) {
  const normalizedYear = Number(year);
  const normalizedMonth = Number(month);
  const monthStart = createLocalDate(normalizedYear, normalizedMonth - 1, 1);
  const monthEnd = createLocalDate(normalizedYear, normalizedMonth, 0);

  return {
    monthStart,
    monthEnd,
    monthStartKey: formatDateKey(monthStart),
    monthEndKey: formatDateKey(monthEnd),
  };
}

function getCurrentLocalDate() {
  const now = new Date();
  return createLocalDate(now.getFullYear(), now.getMonth(), now.getDate());
}

function getSeasonPlanningWindow() {
  const today = getCurrentLocalDate();
  return {
    windowStart: today,
    windowStartKey: formatDateKey(today),
    windowEnd: createLocalDate(today.getFullYear() + 1, 0, 31),
  };
}

function createActorDisplayName(actor) {
  const firstName = normalizeText(actor?.first_name);
  const lastName = normalizeText(actor?.last_name);
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  if (fullName) {
    return fullName;
  }

  return normalizeText(actor?.email) || "Usuario del panel";
}

function buildProductActivationSnapshot({
  productStatus = "inactive",
  hasAnyActiveRange = false,
  nextActiveRange = null,
}) {
  const normalizedStatus = normalizeText(productStatus) || "inactive";
  const hasUpcomingOrCurrentRange = Boolean(nextActiveRange?.fecha_inicio);
  const requiresInitialRange = !hasAnyActiveRange;
  const requiresNewRangeWindow =
    hasAnyActiveRange && !hasUpcomingOrCurrentRange;
  const canActivateNow = hasUpcomingOrCurrentRange;
  let title = "Calendario pendiente";
  let description =
    "Todavia debes definir fechas operables para este producto.";
  let tone = "warning";

  if (normalizedStatus === "active" && hasUpcomingOrCurrentRange) {
    title = "Producto activo y operable";
    description =
      "El producto ya tiene una ventana operativa cargada y puede venderse dentro de esas fechas.";
    tone = "success";
  } else if (normalizedStatus === "active" && !hasUpcomingOrCurrentRange) {
    title = "Producto activo sin fechas vigentes";
    description =
      "El producto sigue activo, pero hoy no tiene fechas futuras o vigentes para operar. Conviene revisar el calendario.";
    tone = "warning";
  } else if (normalizedStatus !== "active" && hasUpcomingOrCurrentRange) {
    title = "Producto Inhabilitado o Inactivo";
    description =
      "El producto conserva fechas operables cargadas, pero su reactivacion debe ser gestionada por LDS antes de volver a venderse.";
    tone = "info";
  } else if (requiresInitialRange) {
    title = "Configura el primer rango activo";
    description =
      "Antes de habilitar este producto debes registrar su primera ventana operativa en el calendario.";
    tone = "warning";
  } else if (requiresNewRangeWindow) {
    title = "Sin fechas futuras vigentes";
    description =
      "Este producto ya tuvo rangos activos, pero hoy no conserva una ventana operativa futura. Necesita un nuevo rango.";
    tone = "warning";
  }

  return {
    productStatus: normalizedStatus,
    hasAnyActiveRange,
    hasUpcomingOrCurrentRange,
    requiresInitialRange,
    requiresNewRangeWindow,
    canActivateNow,
    nextActiveRange,
    title,
    description,
    tone,
  };
}

function normalizeCalendarEvent(row) {
  return {
    id: row.id,
    eventType: normalizeText(row.event_type),
    targetDate: normalizeText(row.target_date),
    rangeStart: normalizeText(row.range_start),
    rangeEnd: normalizeText(row.range_end),
    reason: normalizeText(row.reason),
    metadata:
      row?.metadata && typeof row.metadata === "object" ? row.metadata : {},
    actorName: createActorDisplayName(row?.created_by_user),
    createdAt: row.created_at,
  };
}

function isDateWithinRange(dateKey, range) {
  return (
    normalizeText(dateKey) >= normalizeText(range?.fecha_inicio) &&
    normalizeText(dateKey) <= normalizeText(range?.fecha_fin)
  );
}

function buildPassengerCountByReservationId(passengerRows = []) {
  const passengerCounts = new Map();

  for (const passengerRow of passengerRows) {
    const reservationId = normalizeText(passengerRow?.reservation_id);

    if (!reservationId) {
      continue;
    }

    passengerCounts.set(
      reservationId,
      Number(passengerCounts.get(reservationId) ?? 0) + 1,
    );
  }

  return passengerCounts;
}

function getCapacityMetricsByDate({
  activations = [],
  calendarOverridesByDate = new Map(),
  reservations = [],
  passengerCountsByReservationId = new Map(),
}) {
  const metricsByDate = new Map();

  for (const reservation of reservations) {
    if (!ACTIVE_RESERVATION_STATUSES.includes(normalizeText(reservation?.status))) {
      continue;
    }

    const dateKey = normalizeText(reservation?.travel_date);

    if (!dateKey) {
      continue;
    }

    const currentMetrics = metricsByDate.get(dateKey) ?? {
      reservationCount: 0,
      occupiedPassengers: 0,
    };
    const reservationId = normalizeText(reservation?.id);
    const currentPassengers = Number(
      passengerCountsByReservationId.get(reservationId) ?? 0,
    );
    currentMetrics.reservationCount += 1;
    currentMetrics.occupiedPassengers += currentPassengers;
    metricsByDate.set(dateKey, currentMetrics);
  }

  const allDateKeys = new Set([
    ...activations.flatMap((activation) => [
      normalizeText(activation.fecha_inicio),
      normalizeText(activation.fecha_fin),
    ]),
    ...calendarOverridesByDate.keys(),
    ...metricsByDate.keys(),
  ]);

  for (const dateKey of allDateKeys) {
    if (!dateKey) {
      continue;
    }

    const currentMetrics = metricsByDate.get(dateKey) ?? {
      reservationCount: 0,
      occupiedPassengers: 0,
    };
    const matchingActivation = activations.find((activation) =>
      isDateWithinRange(dateKey, activation),
    );
    const overrideRow = calendarOverridesByDate.get(dateKey);
    const effectiveCapacity = Number(
      overrideRow?.capacity_override ??
        matchingActivation?.default_capacity ??
        0,
    );
    const occupiedPassengers = Number(currentMetrics.occupiedPassengers ?? 0);
    const availableCapacity =
      effectiveCapacity > 0
        ? Math.max(0, effectiveCapacity - occupiedPassengers)
        : 0;
    const occupancyPercentage =
      effectiveCapacity > 0
        ? Math.min(100, Math.round((occupiedPassengers / effectiveCapacity) * 100))
        : 0;

    metricsByDate.set(dateKey, {
      reservationCount: Number(currentMetrics.reservationCount ?? 0),
      occupiedPassengers,
      effectiveCapacity,
      availableCapacity,
      occupancyPercentage,
      hasBlockingReservations: Number(currentMetrics.reservationCount ?? 0) > 0,
    });
  }

  return metricsByDate;
}

function buildRecurringSeasonRanges(periods = [], year) {
  const ranges = [];

  for (const period of periods) {
    const startToken = normalizeText(period?.startMonthDay);
    const endToken = normalizeText(period?.endMonthDay);

    if (!/^\d{2}-\d{2}$/.test(startToken) || !/^\d{2}-\d{2}$/.test(endToken)) {
      continue;
    }

    const [startMonth, startDay] = startToken.split("-").map(Number);
    const [endMonth, endDay] = endToken.split("-").map(Number);
    const crossesYear = startToken > endToken;
    const startDate = createLocalDate(year, startMonth - 1, startDay);
    const endDate = crossesYear
      ? createLocalDate(year + 1, endMonth - 1, endDay)
      : createLocalDate(year, endMonth - 1, endDay);

    ranges.push({
      id: normalizeText(period?.id) || `season-${year}-${startToken}-${endToken}`,
      fecha_inicio: formatDateKey(startDate),
      fecha_fin: formatDateKey(endDate),
      nombre_opcional: normalizeText(period?.label) || "Temporada alta",
      season_type: "high",
      source: "booking_config",
    });
  }

  return ranges;
}

function buildFutureRecurringSeasonRanges(periods = [], { windowStart, windowEnd }) {
  const candidateRanges = [
    ...buildRecurringSeasonRanges(periods, windowStart.getFullYear()),
    ...buildRecurringSeasonRanges(periods, windowStart.getFullYear() + 1),
  ];
  const dedupedRanges = new Map();

  for (const range of candidateRanges) {
    const startDate = parseDateKey(range.fecha_inicio);
    const endDate = parseDateKey(range.fecha_fin);

    if (!startDate || !endDate) {
      continue;
    }

    if (endDate < windowStart || startDate > windowEnd) {
      continue;
    }

    const dedupeKey = [
      normalizeText(range.nombre_opcional),
      normalizeText(range.fecha_inicio),
      normalizeText(range.fecha_fin),
    ].join("|");

    if (!dedupedRanges.has(dedupeKey)) {
      dedupedRanges.set(dedupeKey, range);
    }
  }

  return [...dedupedRanges.values()].sort((left, right) =>
    normalizeText(left.fecha_inicio).localeCompare(normalizeText(right.fecha_inicio)),
  );
}

function getHighSeasonRanges({ seasonRows = [], bookingConfig = {} }) {
  const explicitHighSeasons = (seasonRows ?? []).filter(
    (row) => normalizeText(row?.season_type) === "high",
  );

  if (explicitHighSeasons.length > 0) {
    return explicitHighSeasons.sort((left, right) =>
      normalizeText(left.fecha_inicio).localeCompare(normalizeText(right.fecha_inicio)),
    );
  }

  const bookingPeriods = bookingConfig?.pricingDetails?.seasons?.high?.periods;

  if (!Array.isArray(bookingPeriods) || bookingPeriods.length === 0) {
    return [];
  }

  return buildFutureRecurringSeasonRanges(
    bookingPeriods,
    getSeasonPlanningWindow(),
  );
}

function buildHighSeasonDateSet(seasonRanges = [], monthStartKey, monthEndKey) {
  const highSeasonDateSet = new Set();

  for (const range of seasonRanges) {
    const startDate = parseDateKey(range?.fecha_inicio);
    const endDate = parseDateKey(range?.fecha_fin);

    if (!startDate || !endDate) {
      continue;
    }

    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const dateKey = formatDateKey(cursor);

      if (dateKey >= monthStartKey && dateKey <= monthEndKey) {
        highSeasonDateSet.add(dateKey);
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return highSeasonDateSet;
}

function resolveCalendarDayState({
  dateKey,
  activeRanges,
  calendarOverride,
  highSeasonDateSet,
  capacityMetrics,
  productStatus,
}) {
  const normalizedProductStatus = normalizeText(productStatus) || "inactive";
  const isProductActive = normalizedProductStatus === "active";
  const isWithinActiveRange = activeRanges.some((range) =>
    isDateWithinRange(dateKey, range),
  );
  const hasBlockingReservations =
    Boolean(capacityMetrics?.hasBlockingReservations) && isWithinActiveRange;
  const reservationCount = Number(capacityMetrics?.reservationCount ?? 0);
  const occupancyPercentage = Number(capacityMetrics?.occupancyPercentage ?? 0);
  const effectiveCapacity = Number(capacityMetrics?.effectiveCapacity ?? 0);
  const occupiedPassengers = Number(capacityMetrics?.occupiedPassengers ?? 0);
  const availableCapacity = Number(capacityMetrics?.availableCapacity ?? 0);
  const isHighSeason = highSeasonDateSet.has(dateKey);
  const hasManualOverride = calendarOverride && typeof calendarOverride.is_operable === "boolean";
  const baseOperableState = !isWithinActiveRange
    ? false
    : hasManualOverride
      ? Boolean(calendarOverride.is_operable)
      : true;
  const isOperable = isProductActive && baseOperableState;
  const blockedReason =
    normalizeText(calendarOverride?.blocked_reason) ||
    (!isProductActive && isWithinActiveRange ? "Producto inactivo" : "") ||
    (isWithinActiveRange ? "" : "Fuera del rango activo");

  return {
    isWithinActiveRange,
    isOperable,
    isHighSeason,
    reservationCount,
    occupancyPercentage,
    effectiveCapacity,
    occupiedPassengers,
    availableCapacity,
    hasActiveReservations: reservationCount > 0,
    hasBlockingReservations,
    blockedReason,
    canDeactivate:
      isProductActive && isWithinActiveRange && isOperable && !hasBlockingReservations,
    canReactivate:
      isProductActive && isWithinActiveRange && !isOperable,
  };
}

async function getAuthenticatedUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user?.id) {
    throw new Error("No hay una sesion activa para operar el calendario.");
  }

  return user.id;
}

async function fetchProductActivationSnapshotInternal(normalizedProductId) {
  const todayKey = formatDateKey(getCurrentLocalDate());
  const [productResponse, activeRangesExistenceResponse, nextActiveRangeResponse] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, status")
        .eq("id", normalizedProductId)
        .maybeSingle(),
      supabase
        .from("product_active_ranges")
        .select("id")
        .eq("product_id", normalizedProductId)
        .limit(1),
      supabase
        .from("product_active_ranges")
        .select("id, fecha_inicio, fecha_fin")
        .eq("product_id", normalizedProductId)
        .gte("fecha_fin", todayKey)
        .order("fecha_inicio", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

  const firstError = [
    productResponse,
    activeRangesExistenceResponse,
    nextActiveRangeResponse,
  ]
    .map((response) => response.error)
    .find(Boolean);

  if (firstError) {
    throw firstError;
  }

  if (!productResponse.data) {
    return null;
  }

  return buildProductActivationSnapshot({
    productStatus: productResponse.data.status,
    hasAnyActiveRange: (activeRangesExistenceResponse.data ?? []).length > 0,
    nextActiveRange: nextActiveRangeResponse.data ?? null,
  });
}

async function insertProductCalendarEvent({
  productId,
  eventType,
  actorUserId,
  targetDate = null,
  rangeStart = null,
  rangeEnd = null,
  reason = "",
  metadata = {},
}) {
  const { error } = await supabase.from("product_calendar_events").insert({
    product_id: productId,
    event_type: eventType,
    target_date: targetDate,
    range_start: rangeStart,
    range_end: rangeEnd,
    reason: normalizeText(reason) || null,
    metadata,
    created_by: actorUserId,
  });

  if (error) {
    throw error;
  }
}

async function isProductDateWithinAnyActiveRange(productId, date) {
  const { data, error } = await supabase
    .from("product_active_ranges")
    .select("id", { count: "exact" })
    .eq("product_id", productId)
    .lte("fecha_inicio", date)
    .gte("fecha_fin", date);

  if (error) {
    throw error;
  }

  return (data?.length ?? 0) > 0;
}

function validateActiveRange({ startDate, endDate }) {
  const today = getCurrentLocalDate();
  const currentYear = today.getFullYear();
  const maxStartDate = createLocalDate(currentYear, 11, 31);
  const maxEndDate = createLocalDate(currentYear + 1, 0, 31);

  if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
    throw new Error("Selecciona una fecha inicial valida.");
  }

  if (!(endDate instanceof Date) || Number.isNaN(endDate.getTime())) {
    throw new Error("Selecciona una fecha final valida.");
  }

  if (startDate < today) {
    throw new Error("La fecha inicial no puede ser anterior a hoy.");
  }

  if (startDate > maxStartDate) {
    throw new Error(
      "La fecha inicial solo puede definirse hasta el 31 de diciembre del ano actual.",
    );
  }

  if (endDate < startDate) {
    throw new Error("La fecha final no puede ser anterior a la fecha inicial.");
  }

  if (endDate > maxEndDate) {
    throw new Error(
      "La fecha final solo puede llegar hasta el 31 de enero del ano siguiente.",
    );
  }
}

export async function fetchProductCalendarMonthFromSupabase({
  productId,
  year,
  month,
}) {
  const normalizedProductId = normalizeProductId(productId);

  if (!normalizedProductId) {
    throw new Error("No encontramos el producto del calendario.");
  }

  const { monthStart, monthEnd, monthStartKey, monthEndKey } = getMonthBounds(
    year,
    month,
  );
  const { windowStartKey, windowEnd } = getSeasonPlanningWindow();
  const [
    productResponse,
    detailResponse,
    activeRangesExistenceResponse,
    nextActiveRangeResponse,
    activeRangesResponse,
    activationsResponse,
    calendarDatesResponse,
    seasonsResponse,
    reservationsResponse,
    calendarEventsResponse,
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, nombre, ciudad, punto_encuentro, descripcion_breve, hora_salida, hora_llegada, status, category_key, cover_image_url",
      )
      .eq("id", normalizedProductId)
      .maybeSingle(),
    supabase
      .from("product_detail_content")
      .select("product_id, booking_config, summary")
      .eq("product_id", normalizedProductId)
      .maybeSingle(),
    supabase
      .from("product_active_ranges")
      .select("id")
      .eq("product_id", normalizedProductId)
      .limit(1),
    supabase
      .from("product_active_ranges")
      .select("id, fecha_inicio, fecha_fin")
      .eq("product_id", normalizedProductId)
      .gte("fecha_fin", windowStartKey)
      .order("fecha_inicio", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("product_active_ranges")
      .select("id, product_id, fecha_inicio, fecha_fin, created_by, created_at")
      .eq("product_id", normalizedProductId)
      .lte("fecha_inicio", monthEndKey)
      .gte("fecha_fin", monthStartKey)
      .order("fecha_inicio", { ascending: true }),
    supabase
      .from("product_operation_activations")
      .select("id, product_id, active_range_id, fecha_inicio, fecha_fin, default_capacity, created_by, created_at")
      .eq("product_id", normalizedProductId)
      .lte("fecha_inicio", monthEndKey)
      .gte("fecha_fin", monthStartKey)
      .order("fecha_inicio", { ascending: true }),
    supabase
      .from("product_calendar_dates")
      .select("id, product_id, fecha, is_operable, occupancy_percentage, capacity_override, blocked_reason, updated_by, updated_at")
      .eq("product_id", normalizedProductId)
      .gte("fecha", monthStartKey)
      .lte("fecha", monthEndKey)
      .order("fecha", { ascending: true }),
    supabase
      .from("product_seasons")
      .select("id, product_id, season_type, fecha_inicio, fecha_fin, nombre_opcional")
      .eq("product_id", normalizedProductId)
      .eq("season_type", "high")
      .gte("fecha_fin", windowStartKey)
      .lte("fecha_inicio", formatDateKey(windowEnd))
      .order("fecha_inicio", { ascending: true }),
    supabase
      .from("reservations")
      .select("id, travel_date, status")
      .eq("product_id", normalizedProductId)
      .gte("travel_date", monthStartKey)
      .lte("travel_date", monthEndKey)
      .in("status", ACTIVE_RESERVATION_STATUSES),
    supabase
      .from("product_calendar_events")
      .select(
        "id, event_type, target_date, range_start, range_end, reason, metadata, created_at, created_by_user:users!product_calendar_events_created_by_fkey(first_name, last_name, email)",
      )
      .eq("product_id", normalizedProductId)
      .gte("target_date", monthStartKey)
      .lte("target_date", monthEndKey)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const firstError = [
    productResponse,
    detailResponse,
    activeRangesExistenceResponse,
    nextActiveRangeResponse,
    activeRangesResponse,
    activationsResponse,
    calendarDatesResponse,
    seasonsResponse,
    reservationsResponse,
    calendarEventsResponse,
  ]
    .map((response) => response.error)
    .find(Boolean);

  if (firstError) {
    throw firstError;
  }

  if (!productResponse.data) {
    return null;
  }

  const product = productResponse.data;
  const detail = detailResponse.data ?? null;
  const hasAnyActiveRange = (activeRangesExistenceResponse.data ?? []).length > 0;
  const nextActiveRange = nextActiveRangeResponse.data ?? null;
  const activeRanges = activeRangesResponse.data ?? [];
  const activations = activationsResponse.data ?? [];
  const calendarOverridesByDate = new Map(
    (calendarDatesResponse.data ?? []).map((row) => [normalizeText(row.fecha), row]),
  );
  const seasonRanges = getHighSeasonRanges({
    seasonRows: seasonsResponse.data ?? [],
    bookingConfig: detail?.booking_config ?? {},
  });
  const highSeasonDateSet = buildHighSeasonDateSet(
    seasonRanges,
    monthStartKey,
    monthEndKey,
  );
  const reservations = reservationsResponse.data ?? [];
  let passengerCountsByReservationId = new Map();

  if (reservations.length > 0) {
    const { data: reservationPassengers, error: reservationPassengersError } =
      await supabase
        .from("reservation_passengers")
        .select("reservation_id")
        .in(
          "reservation_id",
          reservations.map((reservation) => reservation.id),
        );

    if (reservationPassengersError) {
      throw reservationPassengersError;
    }

    passengerCountsByReservationId = buildPassengerCountByReservationId(
      reservationPassengers ?? [],
    );
  }

  const capacityMetricsByDate = getCapacityMetricsByDate({
    activations,
    calendarOverridesByDate,
    reservations,
    passengerCountsByReservationId,
  });
  const activation = buildProductActivationSnapshot({
    productStatus: product.status,
    hasAnyActiveRange,
    nextActiveRange,
  });
  const days = [];
  const cursor = new Date(monthStart);

  while (cursor <= monthEnd) {
    const dateKey = formatDateKey(cursor);
    const calendarDayState = resolveCalendarDayState({
      dateKey,
      activeRanges,
      calendarOverride: calendarOverridesByDate.get(dateKey),
      highSeasonDateSet,
      capacityMetrics: capacityMetricsByDate.get(dateKey),
      productStatus: product.status,
    });

    days.push({
      date: dateKey,
      dayNumber: cursor.getDate(),
      month: cursor.getMonth() + 1,
      year: cursor.getFullYear(),
      weekday: cursor.getDay(),
      ...calendarDayState,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const inactiveDatesCount = days.filter((day) => !day.isOperable).length;
  const highSeasonDaysCount = days.filter((day) => day.isHighSeason).length;
  const reservedDaysCount = days.filter((day) => day.hasActiveReservations).length;

  return {
    product: {
      id: normalizedProductId,
      title: product.nombre,
      city: product.ciudad ?? "",
      departurePoint: product.punto_encuentro ?? "",
      summary: detail?.summary ?? product.descripcion_breve ?? "",
      departureTime: normalizeText(product.hora_salida).slice(0, 5),
      returnTime: normalizeText(product.hora_llegada).slice(0, 5),
      status: product.status,
      categoryId: normalizeText(product.category_key),
      image: normalizeText(product.cover_image_url),
    },
    month: {
      year: monthStart.getFullYear(),
      month: monthStart.getMonth() + 1,
      monthStart: monthStartKey,
      monthEnd: monthEndKey,
      monthLabel: new Intl.DateTimeFormat("es-CO", {
        month: "long",
        year: "numeric",
      }).format(monthStart),
    },
    activeRanges,
    seasonRanges,
    activation,
    history: (calendarEventsResponse.data ?? []).map(normalizeCalendarEvent),
    days,
    summary: {
      activeRangesCount: activeRanges.length,
      inactiveDatesCount,
      highSeasonDaysCount,
      reservedDaysCount,
    },
    requiresInitialRange: activation.requiresInitialRange,
  };
}

export async function fetchProductCalendarActivationSnapshotFromSupabase(productId) {
  const normalizedProductId = normalizeProductId(productId);

  if (!normalizedProductId) {
    throw new Error("No encontramos el producto para revisar su activacion.");
  }

  return fetchProductActivationSnapshotInternal(normalizedProductId);
}

export async function fetchProductActiveRangeHistoryFromSupabase(productId) {
  const normalizedProductId = normalizeProductId(productId);

  if (!normalizedProductId) {
    throw new Error(
      "No encontramos el producto para revisar el historial de fechas activas.",
    );
  }

  const [rangesResponse, activationsResponse, disableCasesResponse] = await Promise.all([
    supabase
      .from("product_active_ranges")
      .select(
        "id, fecha_inicio, fecha_fin, created_at, created_by_user:users!product_active_ranges_created_by_fkey(first_name, last_name, email)",
      )
      .eq("product_id", normalizedProductId)
      .order("created_at", { ascending: false }),
    supabase
      .from("product_operation_activations")
      .select("id, active_range_id, default_capacity")
      .eq("product_id", normalizedProductId),
    supabase
      .from("product_disable_cases")
      .select(
        "id, reason_label, reason_other, affected_reservations_count, created_at, requested_by_user:users!product_disable_cases_requested_by_user_id_fkey(first_name, last_name, email)",
      )
      .eq("product_id", normalizedProductId)
      .order("created_at", { ascending: false }),
  ]);

  const firstError = [rangesResponse, activationsResponse, disableCasesResponse]
    .map((response) => response.error)
    .find(Boolean);

  if (firstError) {
    throw firstError;
  }

  const activationByRangeId = new Map(
    (activationsResponse.data ?? [])
      .filter((row) => normalizeText(row?.active_range_id))
      .map((row) => [normalizeText(row.active_range_id), row]),
  );

  const rangeEntries = (rangesResponse.data ?? []).map((row, index) => ({
    id: `active-range-${row.id}`,
    entryType: "active_range",
    title: `Rango activo ${index + 1}`,
    detail:
      `Del ${normalizeText(row.fecha_inicio)} al ${normalizeText(row.fecha_fin)}`,
    secondaryDetail: `${Number(
      activationByRangeId.get(normalizeText(row.id))?.default_capacity ?? 0,
    )} cupos base`,
    actorName: createActorDisplayName(row?.created_by_user),
    createdAt: row.created_at,
  }));

  const disableEntries = (disableCasesResponse.data ?? []).map((row) => ({
    id: `disable-case-${row.id}`,
    entryType: "disable_case",
    title: "Producto inhabilitado",
    detail:
      normalizeText(row.reason_label) === "Otros" && normalizeText(row.reason_other)
        ? `Motivo: ${normalizeText(row.reason_label)} - ${normalizeText(row.reason_other)}`
        : `Motivo: ${normalizeText(row.reason_label) || "No disponible"}`,
    secondaryDetail:
      Number(row.affected_reservations_count ?? 0) > 0
        ? `${Number(row.affected_reservations_count ?? 0)} reservas afectadas`
        : normalizeText(row.reason_other) || "Sin reservas afectadas",
    actorName: createActorDisplayName(row?.requested_by_user),
    createdAt: row.created_at,
  }));

  return [...rangeEntries, ...disableEntries].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export async function createProductActiveRangeInSupabase({
  productId,
  startDate,
  endDate,
  capacity,
  activateProduct = true,
}) {
  const normalizedProductId = normalizeProductId(productId);

  if (!normalizedProductId) {
    throw new Error("No encontramos el producto para registrar fechas activas.");
  }

  const parsedStartDate =
    startDate instanceof Date ? startDate : parseDateKey(normalizeText(startDate));
  const parsedEndDate =
    endDate instanceof Date ? endDate : parseDateKey(normalizeText(endDate));

  validateActiveRange({
    startDate: parsedStartDate,
    endDate: parsedEndDate,
  });
  const normalizedCapacity = validateCapacityValue(capacity);

  const activationBeforeSave =
    await fetchProductActivationSnapshotInternal(normalizedProductId);
  const actorUserId = await getAuthenticatedUserId();
  const payload = {
    product_id: normalizedProductId,
    fecha_inicio: formatDateKey(parsedStartDate),
    fecha_fin: formatDateKey(parsedEndDate),
    created_by: actorUserId,
  };
  const { data, error } = await supabase
    .from("product_active_ranges")
    .insert(payload)
    .select("id, fecha_inicio, fecha_fin")
    .single();

  if (error) {
    throw error;
  }

  const { data: activationData, error: activationError } = await supabase
    .from("product_operation_activations")
    .insert({
      product_id: normalizedProductId,
      active_range_id: data.id,
      fecha_inicio: data?.fecha_inicio ?? payload.fecha_inicio,
      fecha_fin: data?.fecha_fin ?? payload.fecha_fin,
      default_capacity: normalizedCapacity,
      created_by: actorUserId,
    })
    .select("id")
    .single();

  if (activationError) {
    throw activationError;
  }

  await insertProductCalendarEvent({
    productId: normalizedProductId,
    eventType: activationBeforeSave?.hasAnyActiveRange
      ? PRODUCT_CALENDAR_EVENT_TYPES.ACTIVE_RANGE_CREATED
      : PRODUCT_CALENDAR_EVENT_TYPES.INITIAL_RANGE_CREATED,
    actorUserId,
    rangeStart: data?.fecha_inicio ?? payload.fecha_inicio,
    rangeEnd: data?.fecha_fin ?? payload.fecha_fin,
    metadata: {
      activateProduct,
      capacity: normalizedCapacity,
    },
  });

  if (activateProduct) {
    const savedStatus = await updateProductStatusInSupabase(
      normalizedProductId,
      "active",
    );

    if (savedStatus === "active" && activationBeforeSave?.productStatus !== "active") {
      await insertProductCalendarEvent({
        productId: normalizedProductId,
        eventType: PRODUCT_CALENDAR_EVENT_TYPES.PRODUCT_ACTIVATED,
        actorUserId,
        rangeStart: data?.fecha_inicio ?? payload.fecha_inicio,
        rangeEnd: data?.fecha_fin ?? payload.fecha_fin,
        reason: "Activacion posterior a la configuracion de fechas activas.",
      });
    }
  }

  return {
    ...payload,
    id: data?.id,
    capacity: normalizedCapacity,
  };
}

export async function hasBlockingReservationsForProductDate(productId, date) {
  const normalizedProductId = normalizeProductId(productId);
  const normalizedDate = normalizeText(date);

  if (!normalizedProductId || !normalizedDate) {
    return false;
  }

  const { count, error } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("product_id", normalizedProductId)
    .eq("travel_date", normalizedDate)
    .in("status", ACTIVE_RESERVATION_STATUSES);

  if (error) {
    throw error;
  }

  return Number(count ?? 0) > 0;
}

export async function deactivateProductCalendarDateInSupabase({
  productId,
  date,
  reason = "",
}) {
  const normalizedProductId = normalizeProductId(productId);
  const normalizedDate = normalizeText(date);

  if (!normalizedProductId || !normalizedDate) {
    throw new Error("No encontramos la fecha que quieres inactivar.");
  }

  const actorUserId = await getAuthenticatedUserId();

  const isWithinAnyActiveRange = await isProductDateWithinAnyActiveRange(
    normalizedProductId,
    normalizedDate,
  );

  if (!isWithinAnyActiveRange) {
    throw new Error(
      "No puedes inactivar una fecha que esta fuera de los rangos activos del producto.",
    );
  }

  const hasBlockingReservations = await hasBlockingReservationsForProductDate(
    normalizedProductId,
    normalizedDate,
  );

  if (hasBlockingReservations) {
    await insertProductCalendarEvent({
      productId: normalizedProductId,
      eventType: PRODUCT_CALENDAR_EVENT_TYPES.DATE_DEACTIVATION_BLOCKED,
      actorUserId,
      targetDate: normalizedDate,
      reason:
        normalizeText(reason) ||
        "Intento de cierre bloqueado por reservas activas en la fecha.",
    });

    throw new Error(
      "No puedes inactivar esta fecha porque tiene reservas activas asociadas.",
    );
  }

  const payload = {
    product_id: normalizedProductId,
    fecha: normalizedDate,
    is_operable: false,
    blocked_reason: normalizeText(reason) || "Cierre operativo manual",
    updated_by: actorUserId,
  };
  const { error } = await supabase
    .from("product_calendar_dates")
    .upsert(payload, { onConflict: "product_id,fecha" });

  if (error) {
    throw error;
  }

  await insertProductCalendarEvent({
    productId: normalizedProductId,
    eventType: PRODUCT_CALENDAR_EVENT_TYPES.DATE_DEACTIVATED,
    actorUserId,
    targetDate: normalizedDate,
    reason: payload.blocked_reason,
  });

  return payload;
}

export async function reactivateProductCalendarDateInSupabase({
  productId,
  date,
}) {
  const normalizedProductId = normalizeProductId(productId);
  const normalizedDate = normalizeText(date);

  if (!normalizedProductId || !normalizedDate) {
    throw new Error("No encontramos la fecha que quieres reactivar.");
  }

  const isWithinAnyActiveRange = await isProductDateWithinAnyActiveRange(
    normalizedProductId,
    normalizedDate,
  );

  if (!isWithinAnyActiveRange) {
    throw new Error(
      "No puedes reactivar una fecha que esta fuera de los rangos activos del producto.",
    );
  }

  const actorUserId = await getAuthenticatedUserId();
  const payload = {
    product_id: normalizedProductId,
    fecha: normalizedDate,
    is_operable: true,
    blocked_reason: null,
    updated_by: actorUserId,
  };
  const { error } = await supabase
    .from("product_calendar_dates")
    .upsert(payload, { onConflict: "product_id,fecha" });

  if (error) {
    throw error;
  }

  await insertProductCalendarEvent({
    productId: normalizedProductId,
    eventType: PRODUCT_CALENDAR_EVENT_TYPES.DATE_REACTIVATED,
    actorUserId,
    targetDate: normalizedDate,
    reason: "Fecha operativa reactivada manualmente.",
  });

  return payload;
}

export async function fetchProductGroupCapacitySnapshotFromSupabase(productId) {
  const normalizedProductId = normalizeProductId(productId);

  if (!normalizedProductId) {
    return null;
  }

  const today = formatDateKey(new Date());
  const [{ data: activations, error: activationsError }, { data: calendarDates, error: calendarDatesError }] =
    await Promise.all([
      supabase
        .from("product_operation_activations")
        .select("id, fecha_inicio, fecha_fin, default_capacity, created_at")
        .eq("product_id", normalizedProductId)
        .order("fecha_inicio", { ascending: true }),
      supabase
        .from("product_calendar_dates")
        .select("fecha, capacity_override")
        .eq("product_id", normalizedProductId)
        .gte("fecha", today)
        .not("capacity_override", "is", null)
        .order("fecha", { ascending: true })
        .limit(120),
    ]);

  if (activationsError) {
    throw activationsError;
  }

  if (calendarDatesError) {
    throw calendarDatesError;
  }

  const currentActivation =
    activations?.find(
      (activation) =>
        activation.fecha_inicio <= today && activation.fecha_fin >= today,
    ) ??
    activations?.find((activation) => activation.fecha_fin >= today) ??
    activations?.[activations.length - 1] ??
    null;

  const overrides = calendarDates ?? [];

  return {
    currentActivation,
    nextCapacityOverride: overrides[0] ?? null,
    overrideCount: overrides.length,
    upcomingOverrides: overrides.slice(0, 5),
  };
}

export async function fetchProductCapacityDetailByDateFromSupabase({
  productId,
  date,
}) {
  const normalizedProductId = normalizeProductId(productId);
  const normalizedDate = normalizeText(date);

  if (!normalizedProductId || !normalizedDate) {
    return null;
  }

  const [
    { data: activations, error: activationsError },
    { data: calendarDate, error: calendarDateError },
    { data: reservations, error: reservationsError },
  ] = await Promise.all([
    supabase
      .from("product_operation_activations")
      .select("id, fecha_inicio, fecha_fin, default_capacity")
      .eq("product_id", normalizedProductId)
      .lte("fecha_inicio", normalizedDate)
      .gte("fecha_fin", normalizedDate)
      .order("fecha_inicio", { ascending: false })
      .limit(1),
    supabase
      .from("product_calendar_dates")
      .select("fecha, is_operable, blocked_reason, capacity_override")
      .eq("product_id", normalizedProductId)
      .eq("fecha", normalizedDate)
      .maybeSingle(),
    supabase
      .from("reservations")
      .select("id, status, travel_date")
      .eq("product_id", normalizedProductId)
      .eq("travel_date", normalizedDate)
      .in("status", ACTIVE_RESERVATION_STATUSES),
  ]);

  if (activationsError) {
    throw activationsError;
  }

  if (calendarDateError) {
    throw calendarDateError;
  }

  if (reservationsError) {
    throw reservationsError;
  }

  const activeReservations = reservations ?? [];
  let passengerCountsByReservationId = new Map();

  if (activeReservations.length > 0) {
    const { data: passengerRows, error: passengerError } = await supabase
      .from("reservation_passengers")
      .select("reservation_id")
      .in(
        "reservation_id",
        activeReservations.map((reservation) => reservation.id),
      );

    if (passengerError) {
      throw passengerError;
    }

    passengerCountsByReservationId = buildPassengerCountsByReservationId(
      passengerRows ?? [],
    );
  }

  const matchingActivation = activations?.[0] ?? null;
  const occupiedPassengers = activeReservations.reduce((total, reservation) => {
    const reservationId = normalizeText(reservation?.id);
    return (
      total + Number(passengerCountsByReservationId.get(reservationId) ?? 0)
    );
  }, 0);
  const defaultCapacity = Number(matchingActivation?.default_capacity ?? 0);
  const capacityOverride =
    calendarDate?.capacity_override == null
      ? null
      : Number(calendarDate.capacity_override);
  const effectiveCapacity = Number(
    capacityOverride ?? matchingActivation?.default_capacity ?? 0,
  );
  const availableCapacity =
    effectiveCapacity > 0
      ? Math.max(0, effectiveCapacity - occupiedPassengers)
      : 0;
  const occupancyPercentage =
    effectiveCapacity > 0
      ? Math.min(100, Math.round((occupiedPassengers / effectiveCapacity) * 100))
      : 0;
  const isWithinActiveRange = Boolean(matchingActivation);
  const isOperable = !isWithinActiveRange
    ? false
    : typeof calendarDate?.is_operable === "boolean"
      ? Boolean(calendarDate.is_operable)
      : true;

  return {
    date: normalizedDate,
    activeRange: matchingActivation
      ? {
          fecha_inicio: matchingActivation.fecha_inicio,
          fecha_fin: matchingActivation.fecha_fin,
        }
      : null,
    defaultCapacity,
    capacityOverride,
    hasManualCapacityOverride: capacityOverride != null,
    effectiveCapacity,
    occupiedPassengers,
    availableCapacity,
    reservationCount: activeReservations.length,
    occupancyPercentage,
    isWithinActiveRange,
    isOperable,
    blockedReason: normalizeText(calendarDate?.blocked_reason),
  };
}
