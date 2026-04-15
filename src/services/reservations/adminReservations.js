import { supabase } from "../../lib/supabase/client.js";
import { normalizeProductId } from "../../utils/productIds.js";
import {
  getReservationExpirationDateTime,
  isReservationWithinLast24Hours,
  normalizeClockTime,
} from "../../utils/reservationTiming.js";

const ACTIVE_RESERVATION_STATUSES = [
  "reserved",
  "issued",
  "refund_in_progress",
];

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseDateInput(dateValue) {
  const normalizedValue = normalizeText(dateValue);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return null;
  }

  const [year, month, day] = normalizedValue.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createCapacitySnapshotKey(productId, travelDate) {
  return `${normalizeProductId(productId)}::${normalizeText(travelDate)}`;
}

function getTodayKey() {
  const today = new Date();
  return formatDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0));
}

function createDisplayName(user) {
  const fullName = [normalizeText(user?.first_name), normalizeText(user?.last_name)]
    .filter(Boolean)
    .join(" ");

  return fullName || normalizeText(user?.email) || "Usuario LDS";
}

function createCapacityRequestRequiredError({
  productId,
  travelDate,
  requestedPassengerCount,
  currentAvailableCapacity,
  effectiveCapacity,
}) {
  const missingCapacity = Math.max(
    0,
    Number(requestedPassengerCount ?? 0) - Number(currentAvailableCapacity ?? 0),
  );
  const error = new Error(
    `Solo hay ${currentAvailableCapacity} cupo${currentAvailableCapacity === 1 ? "" : "s"} disponible${currentAvailableCapacity === 1 ? "" : "s"} para esta fecha. Puedes solicitar una ampliacion al proveedor.`,
  );
  error.code = "CAPACITY_REQUEST_REQUIRED";
  error.capacityRequestContext = {
    productId,
    travelDate,
    requestedPassengerCount,
    currentAvailableCapacity,
    effectiveCapacity,
    missingCapacity,
  };
  return error;
}

function parseAmount(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const normalizedValue = normalizeText(value).replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function parsePositiveInteger(value) {
  const parsedValue = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function createEmitOnlyReservationError() {
  const error = new Error(
    "Esta reserva esta siendo creada menos de 24 horas antes de la fecha de la actividad. Ya no se puede reservar; unicamente emitir.",
  );
  error.code = "RESERVATION_EMIT_ONLY";
  return error;
}

function resolveReservationExpiresAt(status, createdAt, expiresAt) {
  if (normalizeText(status) !== "reserved") {
    return null;
  }

  const derivedExpiration = getReservationExpirationDateTime(createdAt);

  if (derivedExpiration instanceof Date && !Number.isNaN(derivedExpiration.getTime())) {
    return derivedExpiration.toISOString();
  }

  return expiresAt ?? null;
}

function buildPassengerCountByReservationId(passengerRows = []) {
  const counts = new Map();

  for (const passengerRow of passengerRows) {
    const reservationId = normalizeText(passengerRow?.reservation_id);

    if (!reservationId) {
      continue;
    }

    counts.set(reservationId, Number(counts.get(reservationId) ?? 0) + 1);
  }

  return counts;
}

function createLocatorCandidate() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let locator = "";

  for (let index = 0; index < 6; index += 1) {
    locator += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return locator;
}

async function createUniqueLocator() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = createLocatorCandidate();
    const { data, error } = await supabase
      .from("reservations")
      .select("id")
      .eq("locator", candidate)
      .limit(1);

    if (error) {
      throw error;
    }

    if ((data?.length ?? 0) === 0) {
      return candidate;
    }
  }

  throw new Error("No fue posible generar un localizador unico para la reserva.");
}

export async function previewReservationLocatorInSupabase() {
  return createUniqueLocator();
}

async function getAuthenticatedReservationActorContext() {
  const profile = await getAuthenticatedUserProfile();

  if (profile.agency_id) {
    return {
      userId: profile.id,
      sellerAgencyId: profile.agency_id,
      profile,
    };
  }

  if (profile.role !== "super_user") {
    throw new Error(
      "El usuario autenticado no tiene una agencia asociada para crear reservas.",
    );
  }

  const { data: sellerAgency, error: sellerAgencyError } = await supabase
    .from("agencies")
    .select("id")
    .eq("agency_type", "seller")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (sellerAgencyError) {
    throw sellerAgencyError;
  }

  if (sellerAgency?.id) {
    return {
      userId: profile.id,
      sellerAgencyId: sellerAgency.id,
      profile,
    };
  }

  const { data: providerAgency, error: providerAgencyError } = await supabase
    .from("agencies")
    .select("id")
    .eq("agency_type", "provider")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (providerAgencyError) {
    throw providerAgencyError;
  }

  if (!providerAgency?.id) {
    throw new Error("No encontramos una agencia activa para registrar la reserva.");
  }

  return {
    userId: profile.id,
    sellerAgencyId: providerAgency.id,
    profile,
  };
}

async function getAuthenticatedUserProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user?.id) {
    throw new Error("No hay una sesion activa para gestionar reservas.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select(`
      id,
      agency_id,
      role,
      first_name,
      last_name,
      email,
      agency:agencies (
        id,
        agency_type,
        nombre
      )
    `)
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    throw new Error("No encontramos el perfil del usuario autenticado en public.users.");
  }

  return profile;
}

function canViewerReadProviderPaymentHistory(profile) {
  if (!profile) {
    return false;
  }

  if (profile.role === "super_user") {
    return true;
  }

  return (
    ["agency_admin", "travel_agent"].includes(normalizeText(profile.role)) &&
    normalizeText(profile?.agency?.agency_type) === "provider"
  );
}

function mapPaymentAttemptStatusLabel(value) {
  const normalizedValue = normalizeText(value);

  if (normalizedValue === "paid") {
    return "Pago completado";
  }

  if (normalizedValue === "requires_redirect") {
    return "Pago pendiente de checkout";
  }

  if (normalizedValue === "failed") {
    return "Pago fallido";
  }

  if (normalizedValue === "expired") {
    return "Pago expirado";
  }

  return "Pago pendiente";
}

function applyReservationVisibilityScope(query, profile) {
  if (!profile) {
    return query;
  }

  if (profile.role === "super_user") {
    return query;
  }

  if (profile.role === "travel_agent") {
    return query.eq("created_by_user_id", profile.id);
  }

  if (profile.role === "agency_admin" && profile.agency_id) {
    return query.eq("seller_agency_id", profile.agency_id);
  }

  return query.eq("id", "__no_visible_reservations__");
}

async function fetchProductsByIds(productIds = []) {
  const uniqueProductIds = [...new Set(productIds.map(normalizeProductId).filter(Boolean))];

  if (uniqueProductIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, nombre, ciudad, provider_agency_id, hora_salida, punto_encuentro, category_key, status")
    .in("id", uniqueProductIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((product) => [product.id, product]));
}

async function fetchAgenciesByIds(agencyIds = []) {
  const uniqueAgencyIds = [...new Set(agencyIds.map(normalizeText).filter(Boolean))];

  if (uniqueAgencyIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("agencies")
    .select("id, nombre, agency_type")
    .in("id", uniqueAgencyIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((agency) => [agency.id, agency]));
}

async function fetchUsersByIds(userIds = []) {
  const uniqueUserIds = [...new Set(userIds.map(normalizeText).filter(Boolean))];

  if (uniqueUserIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email")
    .in("id", uniqueUserIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((user) => [user.id, user]));
}

async function fetchPassengerCountsByReservationIds(reservationIds = []) {
  const uniqueReservationIds = [...new Set(reservationIds.map(normalizeText).filter(Boolean))];

  if (uniqueReservationIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("reservation_passengers")
    .select("reservation_id")
    .in("reservation_id", uniqueReservationIds);

  if (error) {
    throw error;
  }

  const counts = new Map();

  for (const row of data ?? []) {
    const reservationId = normalizeText(row.reservation_id);
    counts.set(reservationId, Number(counts.get(reservationId) ?? 0) + 1);
  }

  return counts;
}

async function getProductOperationalState(productId, travelDate) {
  const [
    { data: ranges, error: rangesError },
    { data: dateOverride, error: dateOverrideError },
    { data: activation, error: activationError },
  ] =
    await Promise.all([
      supabase
        .from("product_active_ranges")
        .select("id")
        .eq("product_id", productId)
        .lte("fecha_inicio", travelDate)
        .gte("fecha_fin", travelDate)
        .limit(1),
      supabase
        .from("product_calendar_dates")
        .select("id, is_operable, blocked_reason, capacity_override")
        .eq("product_id", productId)
        .eq("fecha", travelDate)
        .maybeSingle(),
      supabase
        .from("product_operation_activations")
        .select("id, default_capacity")
        .eq("product_id", productId)
        .lte("fecha_inicio", travelDate)
        .gte("fecha_fin", travelDate)
        .order("fecha_inicio", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (rangesError) {
    throw rangesError;
  }

  if (dateOverrideError) {
    throw dateOverrideError;
  }

  if (activationError) {
    throw activationError;
  }

  const isWithinActiveRange = (ranges?.length ?? 0) > 0;
  const isOperable = !isWithinActiveRange
    ? false
    : typeof dateOverride?.is_operable === "boolean"
      ? Boolean(dateOverride.is_operable)
      : true;

  return {
    isWithinActiveRange,
    isOperable,
    defaultCapacity: Number(activation?.default_capacity ?? 0),
    capacityOverride:
      dateOverride?.capacity_override == null
        ? null
        : Number(dateOverride.capacity_override),
    blockedReason: normalizeText(dateOverride?.blocked_reason),
  };
}

async function getTravelDateCapacitySnapshot({ productId, travelDate }) {
  const operationalState = await getProductOperationalState(productId, travelDate);
  const { data: reservations, error: reservationsError } = await supabase
    .from("reservations")
    .select("id, status")
    .eq("product_id", productId)
    .eq("travel_date", travelDate)
    .in("status", ACTIVE_RESERVATION_STATUSES);

  if (reservationsError) {
    throw reservationsError;
  }

  const activeReservations = reservations ?? [];
  const activeReservationIds = activeReservations.map((reservation) =>
    normalizeText(reservation.id),
  );
  let passengerCountsByReservationId = new Map();

  if (activeReservationIds.length > 0) {
    const { data: passengerRows, error: passengerError } = await supabase
      .from("reservation_passengers")
      .select("reservation_id")
      .in("reservation_id", activeReservationIds);

    if (passengerError) {
      throw passengerError;
    }

    passengerCountsByReservationId = buildPassengerCountByReservationId(
      passengerRows ?? [],
    );
  }

  const occupiedPassengers = activeReservations.reduce(
    (total, reservation) =>
      total +
      Number(
        passengerCountsByReservationId.get(normalizeText(reservation.id)) ?? 0,
      ),
    0,
  );
  const effectiveCapacity =
    operationalState.capacityOverride ?? operationalState.defaultCapacity ?? 0;
  const availableCapacity =
    effectiveCapacity > 0
      ? Math.max(0, effectiveCapacity - occupiedPassengers)
      : 0;

  return {
    effectiveCapacity,
    occupiedPassengers,
    availableCapacity,
    operationalState,
  };
}

async function resolveTravelDateCapacityForReservation({
  productId,
  travelDate,
  requestedPassengerCount,
}) {
  const capacitySnapshot = await getTravelDateCapacitySnapshot({
    productId,
    travelDate,
  });
  const { effectiveCapacity, occupiedPassengers, availableCapacity } =
    capacitySnapshot;

  if (effectiveCapacity <= 0) {
    throw new Error(
      "La fecha seleccionada no tiene un cupo configurado. Pide al proveedor habilitar o ajustar la capacidad antes de continuar.",
    );
  }

  if (availableCapacity < requestedPassengerCount) {
    throw createCapacityRequestRequiredError({
      productId,
      travelDate,
      requestedPassengerCount,
      currentAvailableCapacity: availableCapacity,
      effectiveCapacity,
    });
  }

  return {
    effectiveCapacity,
    occupiedPassengers,
    availableCapacity,
  };
}

function canReviewCapacityRequest(profile, requestRow) {
  if (!profile || !requestRow) {
    return false;
  }

  if (profile.role === "super_user") {
    return true;
  }

  return (
    profile.role === "agency_admin" &&
    normalizeText(profile.agency_id) === normalizeText(requestRow.provider_agency_id)
  );
}

async function fetchCapacitySnapshotsByRequestRows(requestRows = []) {
  const uniqueKeys = [
    ...new Set(
      requestRows
        .map((requestRow) =>
          createCapacitySnapshotKey(requestRow.product_id, requestRow.travel_date),
        )
        .filter(Boolean),
    ),
  ];

  if (uniqueKeys.length === 0) {
    return new Map();
  }

  const entries = await Promise.all(
    uniqueKeys.map(async (snapshotKey) => {
      const [productId, travelDate] = snapshotKey.split("::");
      const snapshot = await getTravelDateCapacitySnapshot({ productId, travelDate });
      return [snapshotKey, snapshot];
    }),
  );

  return new Map(entries);
}

async function fetchCapacityRequestRecipients(providerAgencyId) {
  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email")
    .eq("agency_id", providerAgencyId)
    .eq("role", "agency_admin")
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).filter((user) => normalizeText(user.email));
}

function buildCapacityRequestMailto({
  recipientEmails,
  productName,
  travelDate,
  sellerAgencyName,
  requestedPassengerCount,
  missingCapacity,
  reason,
}) {
  const recipients = recipientEmails.filter(Boolean);

  if (recipients.length === 0) {
    return "";
  }

  const subject = encodeURIComponent(
    `Solicitud de ampliacion de cupo - ${productName} - ${travelDate}`,
  );
  const body = encodeURIComponent(
    [
      "Hola,",
      "",
      `La agencia vendedora ${sellerAgencyName} solicita ampliacion de cupo para el producto ${productName}.`,
      `Fecha solicitada: ${travelDate}.`,
      `Pasajeros solicitados: ${requestedPassengerCount}.`,
      `Cupos adicionales requeridos: ${missingCapacity}.`,
      reason ? `Motivo / observacion: ${reason}.` : null,
      "",
      "Revisar la solicitud registrada en LDS para ampliar la capacidad de la fecha si aplica.",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return `mailto:${recipients.join(",")}?subject=${subject}&body=${body}`;
}

export async function createCapacityRequestInSupabase({
  productId,
  travelDate,
  requestedPassengerCount,
  reason = "",
}) {
  const normalizedProductId = normalizeProductId(productId);
  const parsedTravelDate = parseDateInput(travelDate);
  const normalizedTravelDate = parsedTravelDate
    ? formatDateKey(parsedTravelDate)
    : "";
  const normalizedPassengerCount = Number.parseInt(
    String(requestedPassengerCount ?? "").trim(),
    10,
  );

  if (!normalizedProductId || !normalizedTravelDate) {
    throw new Error("Selecciona un producto y una fecha validos para solicitar cupos.");
  }

  if (!Number.isInteger(normalizedPassengerCount) || normalizedPassengerCount <= 0) {
    throw new Error("Indica cuantos pasajeros necesitan cupo para crear la solicitud.");
  }

  const actorContext = await getAuthenticatedReservationActorContext();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, nombre, provider_agency_id")
    .eq("id", normalizedProductId)
    .maybeSingle();

  if (productError) {
    throw productError;
  }

  if (!product) {
    throw new Error("No encontramos el producto seleccionado para crear la solicitud.");
  }

  const { data: sellerAgency, error: sellerAgencyError } = await supabase
    .from("agencies")
    .select("id, nombre")
    .eq("id", actorContext.sellerAgencyId)
    .maybeSingle();

  if (sellerAgencyError) {
    throw sellerAgencyError;
  }

  const capacitySnapshot = await resolveTravelDateCapacityForReservation({
    productId: normalizedProductId,
    travelDate: normalizedTravelDate,
    requestedPassengerCount: 0,
  });
  const missingCapacity = Math.max(
    0,
    normalizedPassengerCount - Number(capacitySnapshot.availableCapacity ?? 0),
  );
  const { data: createdRequest, error: requestError } = await supabase
    .from("capacity_requests")
    .insert({
      product_id: normalizedProductId,
      provider_agency_id: product.provider_agency_id,
      seller_agency_id: actorContext.sellerAgencyId,
      requested_by_user_id: actorContext.userId,
      travel_date: normalizedTravelDate,
      requested_passenger_count: normalizedPassengerCount,
      current_available_capacity: Number(capacitySnapshot.availableCapacity ?? 0),
      missing_capacity: missingCapacity,
      reason: normalizeText(reason) || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (requestError) {
    throw requestError;
  }

  const recipients = await fetchCapacityRequestRecipients(product.provider_agency_id);
  const recipientEmails = recipients.map((recipient) => normalizeText(recipient.email));

  return {
    id: createdRequest.id,
    recipientEmails,
    mailtoUrl: buildCapacityRequestMailto({
      recipientEmails,
      productName: product.nombre,
      travelDate: normalizedTravelDate,
      sellerAgencyName: sellerAgency?.nombre || "Agencia vendedora",
      requestedPassengerCount: normalizedPassengerCount,
      missingCapacity,
      reason: normalizeText(reason),
    }),
    missingCapacity,
    currentAvailableCapacity: Number(capacitySnapshot.availableCapacity ?? 0),
  };
}

export async function fetchCapacityRequestListFromSupabase() {
  const viewerProfile = await getAuthenticatedUserProfile();
  const { data, error } = await supabase
    .from("capacity_requests")
    .select(
      "id, product_id, provider_agency_id, seller_agency_id, requested_by_user_id, travel_date, requested_passenger_count, current_available_capacity, missing_capacity, reason, status, reviewed_by_user_id, reviewed_at, resolution_notes, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  const [productsById, agenciesById, usersById, capacitySnapshotsByKey] =
    await Promise.all([
      fetchProductsByIds(rows.map((requestRow) => requestRow.product_id)),
      fetchAgenciesByIds([
        ...rows.map((requestRow) => requestRow.provider_agency_id),
        ...rows.map((requestRow) => requestRow.seller_agency_id),
      ]),
      fetchUsersByIds([
        ...rows.map((requestRow) => requestRow.requested_by_user_id),
        ...rows.map((requestRow) => requestRow.reviewed_by_user_id),
      ]),
      fetchCapacitySnapshotsByRequestRows(rows),
    ]);

  return rows.map((requestRow) => {
    const product = productsById.get(requestRow.product_id);
    const providerAgency = agenciesById.get(requestRow.provider_agency_id);
    const sellerAgency = agenciesById.get(requestRow.seller_agency_id);
    const requester = usersById.get(requestRow.requested_by_user_id);
    const reviewer = usersById.get(requestRow.reviewed_by_user_id);
    const liveSnapshot =
      capacitySnapshotsByKey.get(
        createCapacitySnapshotKey(requestRow.product_id, requestRow.travel_date),
      ) ?? null;
    const effectiveCapacity = Number(
      liveSnapshot?.effectiveCapacity ?? requestRow.current_available_capacity ?? 0,
    );
    const occupiedPassengers = Number(liveSnapshot?.occupiedPassengers ?? 0);
    const availableCapacity = Number(
      liveSnapshot?.availableCapacity ?? requestRow.current_available_capacity ?? 0,
    );
    const requestedPassengerCount = Number(
      requestRow.requested_passenger_count ?? 0,
    );
    const suggestedCapacity = Math.max(
      effectiveCapacity,
      occupiedPassengers + requestedPassengerCount,
    );

    return {
      id: requestRow.id,
      productId: requestRow.product_id,
      productName: product?.nombre || "Producto sin nombre",
      city: normalizeText(product?.ciudad),
      providerAgencyId: requestRow.provider_agency_id,
      providerAgencyName:
        providerAgency?.nombre || "Agencia proveedora no disponible",
      sellerAgencyId: requestRow.seller_agency_id,
      sellerAgencyName:
        sellerAgency?.nombre || "Agencia vendedora no disponible",
      requestedByUserId: requestRow.requested_by_user_id,
      requestedByName: createDisplayName(requester),
      reviewedByUserId: requestRow.reviewed_by_user_id,
      reviewedByName: createDisplayName(reviewer),
      travelDate: requestRow.travel_date,
      requestedPassengerCount,
      currentAvailableCapacity: Number(
        requestRow.current_available_capacity ?? 0,
      ),
      missingCapacity: Number(requestRow.missing_capacity ?? 0),
      reason: normalizeText(requestRow.reason),
      status: normalizeText(requestRow.status) || "pending",
      reviewedAt: requestRow.reviewed_at,
      resolutionNotes: normalizeText(requestRow.resolution_notes),
      createdAt: requestRow.created_at,
      effectiveCapacity,
      occupiedPassengers,
      availableCapacity,
      suggestedCapacity,
      canReview: canReviewCapacityRequest(viewerProfile, requestRow),
    };
  });
}

export async function approveCapacityRequestInSupabase({
  requestId,
  newCapacity,
  resolutionNotes = "",
}) {
  const normalizedRequestId = normalizeText(requestId);
  const normalizedCapacity = parsePositiveInteger(newCapacity);

  if (!normalizedRequestId) {
    throw new Error("No encontramos la solicitud que quieres aprobar.");
  }

  if (!normalizedCapacity) {
    throw new Error("Indica un cupo total valido para la fecha.");
  }

  const reviewerProfile = await getAuthenticatedUserProfile();
  const { data: requestRow, error: requestError } = await supabase
    .from("capacity_requests")
    .select(
      "id, product_id, provider_agency_id, travel_date, requested_passenger_count, status",
    )
    .eq("id", normalizedRequestId)
    .maybeSingle();

  if (requestError) {
    throw requestError;
  }

  if (!requestRow) {
    throw new Error("La solicitud ya no existe o no tienes acceso a ella.");
  }

  if (!canReviewCapacityRequest(reviewerProfile, requestRow)) {
    throw new Error("No tienes permisos para revisar esta solicitud.");
  }

  if (normalizeText(requestRow.status) !== "pending") {
    throw new Error("Solo puedes aprobar solicitudes que aun esten pendientes.");
  }

  const capacitySnapshot = await getTravelDateCapacitySnapshot({
    productId: requestRow.product_id,
    travelDate: requestRow.travel_date,
  });
  const minimumRequiredCapacity = Math.max(
    Number(capacitySnapshot.effectiveCapacity ?? 0),
    Number(capacitySnapshot.occupiedPassengers ?? 0) +
      Number(requestRow.requested_passenger_count ?? 0),
  );

  if (normalizedCapacity < minimumRequiredCapacity) {
    throw new Error(
      `El cupo total debe ser al menos ${minimumRequiredCapacity} para cubrir la solicitud y la ocupacion actual de la fecha.`,
    );
  }

  const { data: calendarDate, error: calendarDateError } = await supabase
    .from("product_calendar_dates")
    .select("id, is_operable")
    .eq("product_id", requestRow.product_id)
    .eq("fecha", requestRow.travel_date)
    .maybeSingle();

  if (calendarDateError) {
    throw calendarDateError;
  }

  if (calendarDate && calendarDate.is_operable === false) {
    throw new Error(
      "No puedes ampliar el cupo de una fecha no operable. Reactivala primero desde el calendario.",
    );
  }

  const overridePayload = {
    product_id: requestRow.product_id,
    fecha: requestRow.travel_date,
    blocked_reason: null,
    capacity_override: normalizedCapacity,
    updated_by: reviewerProfile.id,
  };

  if (!calendarDate) {
    overridePayload.is_operable = true;
  }

  const { error: overrideError } = await supabase
    .from("product_calendar_dates")
    .upsert(overridePayload, { onConflict: "product_id,fecha" });

  if (overrideError) {
    throw overrideError;
  }

  const { error: updateError } = await supabase
    .from("capacity_requests")
    .update({
      status: "approved",
      reviewed_by_user_id: reviewerProfile.id,
      reviewed_at: new Date().toISOString(),
      resolution_notes: normalizeText(resolutionNotes) || null,
    })
    .eq("id", normalizedRequestId);

  if (updateError) {
    throw updateError;
  }

  return {
    id: normalizedRequestId,
    status: "approved",
    capacityOverride: normalizedCapacity,
  };
}

export async function rejectCapacityRequestInSupabase({
  requestId,
  resolutionNotes = "",
}) {
  const normalizedRequestId = normalizeText(requestId);

  if (!normalizedRequestId) {
    throw new Error("No encontramos la solicitud que quieres rechazar.");
  }

  const reviewerProfile = await getAuthenticatedUserProfile();
  const { data: requestRow, error: requestError } = await supabase
    .from("capacity_requests")
    .select("id, provider_agency_id, status")
    .eq("id", normalizedRequestId)
    .maybeSingle();

  if (requestError) {
    throw requestError;
  }

  if (!requestRow) {
    throw new Error("La solicitud ya no existe o no tienes acceso a ella.");
  }

  if (!canReviewCapacityRequest(reviewerProfile, requestRow)) {
    throw new Error("No tienes permisos para revisar esta solicitud.");
  }

  if (normalizeText(requestRow.status) !== "pending") {
    throw new Error("Solo puedes rechazar solicitudes que aun esten pendientes.");
  }

  const { error: updateError } = await supabase
    .from("capacity_requests")
    .update({
      status: "rejected",
      reviewed_by_user_id: reviewerProfile.id,
      reviewed_at: new Date().toISOString(),
      resolution_notes: normalizeText(resolutionNotes) || null,
    })
    .eq("id", normalizedRequestId);

  if (updateError) {
    throw updateError;
  }

  return {
    id: normalizedRequestId,
    status: "rejected",
  };
}

async function resolveSeasonType(productId, travelDate) {
  const { data, error } = await supabase
    .from("product_seasons")
    .select("id, season_type")
    .eq("product_id", productId)
    .lte("fecha_inicio", travelDate)
    .gte("fecha_fin", travelDate)
    .order("fecha_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeText(data?.season_type) || "low";
}

function normalizePassengerDrafts(passengers = []) {
  return (Array.isArray(passengers) ? passengers : [])
    .map((passenger) => ({
      first_name: normalizeText(passenger?.firstName),
      last_name: normalizeText(passenger?.lastName),
      passenger_type: normalizeText(passenger?.passengerType) || "ADT",
      document_type: normalizeText(passenger?.documentType) || null,
      document_number: normalizeText(passenger?.documentNumber) || null,
      country: normalizeText(passenger?.country) || null,
      sex: normalizeText(passenger?.sex) || null,
      birth_date: normalizeText(passenger?.birthDate) || null,
      phone: normalizeText(passenger?.phone) || null,
      passenger_status: "active",
      charged_rate: passenger?.chargedRate !== undefined ? Number(passenger.chargedRate) : null,
    }))
    .filter((passenger) => passenger.first_name && passenger.last_name);
}

function validateReservationDraft({
  productId,
  travelDate,
  totalAmount,
  paymentType,
  passengers,
}) {
  if (!normalizeProductId(productId)) {
    throw new Error("Selecciona el producto que quieres reservar.");
  }

  const parsedTravelDate = parseDateInput(travelDate);

  if (!parsedTravelDate) {
    throw new Error("Selecciona una fecha de viaje valida.");
  }

  if (formatDateKey(parsedTravelDate) < getTodayKey()) {
    throw new Error("La fecha de viaje no puede ser anterior a hoy.");
  }

  if (parseAmount(totalAmount) <= 0) {
    throw new Error("Define un valor total valido para la reserva.");
  }

  if (!normalizeText(paymentType)) {
    throw new Error("Selecciona el tipo de pago de la reserva.");
  }

  if ((passengers?.length ?? 0) === 0) {
    throw new Error("Agrega al menos un pasajero a la reserva.");
  }
}

export async function fetchReservationProductOptionsFromSupabase() {
  const [productsResponse, detailResponse] = await Promise.all([
    supabase
      .from("products")
      .select("id, nombre, ciudad, hora_salida, status")
      .eq("status", "active")
      .order("nombre", { ascending: true }),
    supabase
      .from("product_detail_content")
      .select("product_id, booking_config"),
  ]);

  const firstError = [productsResponse, detailResponse]
    .map((response) => response.error)
    .find(Boolean);

  if (firstError) {
    throw firstError;
  }

  const bookingByProductId = new Map(
    (detailResponse.data ?? []).map((detailRow) => [
      detailRow.product_id,
      detailRow?.booking_config ?? null,
    ]),
  );

  return (productsResponse.data ?? []).map((product) => {
    const bookingConfig = bookingByProductId.get(product.id) ?? {};

    return {
      id: product.id,
      title: product.nombre,
      city: normalizeText(product.ciudad),
      departureTime: normalizeText(product.hora_salida).slice(0, 5),
      suggestedAmount: parseAmount(bookingConfig?.price ?? 0),
    };
  });
}

export async function fetchReservationListFromSupabase() {
  const viewerProfile = await getAuthenticatedUserProfile();
  let reservationsQuery = supabase
    .from("reservations")
    .select(
      "id, locator, product_id, seller_agency_id, product_owner_agency_id, created_by_user_id, status, reservation_type, booking_date, issue_date, travel_date, embark_time, payment_type, payment_status, total_amount, currency, season_type, notes_summary, created_at, expires_at",
    )
    .order("created_at", { ascending: false });

  reservationsQuery = applyReservationVisibilityScope(
    reservationsQuery,
    viewerProfile,
  );

  const { data: reservations, error } = await reservationsQuery;

  if (error) {
    throw error;
  }

  const rows = reservations ?? [];
  const [productsById, agenciesById, usersById, passengerCountsByReservationId] =
    await Promise.all([
      fetchProductsByIds(rows.map((reservation) => reservation.product_id)),
      fetchAgenciesByIds([
        ...rows.map((reservation) => reservation.seller_agency_id),
        ...rows.map((reservation) => reservation.product_owner_agency_id),
      ]),
      fetchUsersByIds(rows.map((reservation) => reservation.created_by_user_id)),
      fetchPassengerCountsByReservationIds(rows.map((reservation) => reservation.id)),
    ]);

  return rows.map((reservation) => {
    const product = productsById.get(reservation.product_id);
    const sellerAgency = agenciesById.get(reservation.seller_agency_id);
    const creator = usersById.get(reservation.created_by_user_id);

    return {
      id: reservation.id,
      locator: reservation.locator,
      status: normalizeText(reservation.status),
      reservationType: normalizeText(reservation.reservation_type),
      bookingDate: reservation.booking_date,
      issueDate: reservation.issue_date,
      travelDate: reservation.travel_date,
      embarkTime: normalizeText(reservation.embark_time).slice(0, 5),
      paymentType: normalizeText(reservation.payment_type),
      paymentStatus: normalizeText(reservation.payment_status),
      totalAmount: Number(reservation.total_amount ?? 0),
      currency: normalizeText(reservation.currency) || "COP",
      seasonType: normalizeText(reservation.season_type) || "low",
      notesSummary: normalizeText(reservation.notes_summary),
      createdAt: reservation.created_at,
      expiresAt: resolveReservationExpiresAt(
        reservation.status,
        reservation.created_at,
        reservation.expires_at,
      ),
      productName: product?.nombre || "Producto sin nombre",
      city: normalizeText(product?.ciudad),
      sellerAgencyName: sellerAgency?.nombre || "Agencia no disponible",
      createdByName: createDisplayName(creator),
      passengerCount: Number(passengerCountsByReservationId.get(reservation.id) ?? 0),
      hasCalendarImpact: ACTIVE_RESERVATION_STATUSES.includes(
        normalizeText(reservation.status),
      ),
    };
  });
}

export async function fetchReservationDetailFromSupabase(reservationId) {
  const normalizedReservationId = normalizeText(reservationId);

  if (!normalizedReservationId) {
    throw new Error("No encontramos la reserva solicitada.");
  }

  const viewerProfile = await getAuthenticatedUserProfile();
  const canViewInternalPaymentHistory =
    canViewerReadProviderPaymentHistory(viewerProfile);

  const [
    reservationResponse,
    passengersResponse,
    historyResponse,
    notesResponse,
    paymentHistoryResponse,
  ] = await Promise.all([
    supabase
      .from("reservations")
      .select(
        "id, locator, product_id, seller_agency_id, product_owner_agency_id, created_by_user_id, parent_reservation_id, origin_type, status, reservation_type, booking_date, issue_date, travel_date, embark_time, payment_type, payment_status, total_amount, currency, season_type, notes_summary, created_at, updated_at, coupon_code, discount_percentage",
      )
      .eq("id", normalizedReservationId)
      .maybeSingle(),
    supabase
      .from("reservation_passengers")
      .select(
        "id, first_name, last_name, passenger_type, document_type, document_number, country, sex, birth_date, phone, passenger_status, charged_rate, created_at",
      )
      .eq("reservation_id", normalizedReservationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("reservation_status_history")
      .select(
        "id, previous_status, new_status, reason, changed_by_user_id, changed_at",
      )
      .eq("reservation_id", normalizedReservationId)
      .order("changed_at", { ascending: false }),
    supabase
      .from("reservation_notes")
      .select("id, body, created_by_user_id, created_at")
      .eq("reservation_id", normalizedReservationId)
      .order("created_at", { ascending: false }),
    canViewInternalPaymentHistory
      ? supabase
          .from("payment_attempt_history")
          .select(
            "id, payment_attempt_id, event_type, previous_status, new_status, details, changed_by_user_id, created_at",
          )
          .eq("reservation_id", normalizedReservationId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const firstError = [
    reservationResponse,
    passengersResponse,
    historyResponse,
    notesResponse,
    paymentHistoryResponse,
  ]
    .map((response) => response.error)
    .find(Boolean);

  if (firstError) {
    throw firstError;
  }

  const reservation = reservationResponse.data;

  if (!reservation) {
    return null;
  }

  const [productsById, agenciesById, usersById, productDetailResponse, galleryResponse, subcategoryLinkResponse] = await Promise.all([
    fetchProductsByIds([reservation.product_id]),
    fetchAgenciesByIds([
      reservation.seller_agency_id,
      reservation.product_owner_agency_id,
    ]),
    fetchUsersByIds([
      reservation.created_by_user_id,
      ...(historyResponse.data ?? []).map((entry) => entry.changed_by_user_id),
      ...(notesResponse.data ?? []).map((entry) => entry.created_by_user_id),
      ...(paymentHistoryResponse.data ?? []).map((entry) => entry.changed_by_user_id),
    ]),
    supabase
      .from("product_detail_content")
      .select("summary")
      .eq("product_id", reservation.product_id)
      .maybeSingle(),
    supabase
      .from("product_gallery_images")
      .select("image_url")
      .eq("product_id", reservation.product_id)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("product_subcategory_links")
      .select("product_subcategory_id")
      .eq("product_id", reservation.product_id)
      .limit(1)
      .maybeSingle(),
  ]);

  let subcategoryName = "";
  if (subcategoryLinkResponse?.data?.product_subcategory_id) {
    const { data: subcatData } = await supabase
      .from("product_subcategories")
      .select("nombre")
      .eq("id", subcategoryLinkResponse.data.product_subcategory_id)
      .maybeSingle();
    subcategoryName = normalizeText(subcatData?.nombre);
  }

  if (productDetailResponse.error) {
    throw productDetailResponse.error;
  }

  const product = productsById.get(reservation.product_id);
  const sellerAgency = agenciesById.get(reservation.seller_agency_id);
  const ownerAgency = agenciesById.get(reservation.product_owner_agency_id);
  const creator = usersById.get(reservation.created_by_user_id);
  const statusHistory = (historyResponse.data ?? []).map((entry) => ({
    id: `status-${entry.id}`,
    kind: "reservation_status",
    previousStatus: normalizeText(entry.previous_status),
    newStatus: normalizeText(entry.new_status),
    title: normalizeText(entry.new_status),
    description:
      normalizeText(entry.reason) || "Movimiento de estado registrado en la reserva.",
    occurredAt: entry.changed_at,
    actorName: createDisplayName(usersById.get(entry.changed_by_user_id)),
  }));
  const paymentHistory = canViewInternalPaymentHistory
    ? (paymentHistoryResponse.data ?? []).map((entry) => ({
        id: `payment-${entry.id}`,
        kind: "payment_event",
        eventType: normalizeText(entry.event_type),
        previousStatus: normalizeText(entry.previous_status),
        newStatus: normalizeText(entry.new_status),
        title: mapPaymentAttemptStatusLabel(entry.new_status),
        description:
          normalizeText(entry.details) ||
          "Movimiento interno de pago registrado en la reserva.",
        occurredAt: entry.created_at,
        actorName: createDisplayName(usersById.get(entry.changed_by_user_id)),
      }))
    : [];
  const activityHistory = [...statusHistory, ...paymentHistory].sort(
    (leftEntry, rightEntry) =>
      new Date(rightEntry.occurredAt).getTime() -
      new Date(leftEntry.occurredAt).getTime(),
  );

  return {
    id: reservation.id,
    locator: reservation.locator,
    status: normalizeText(reservation.status),
    originType: normalizeText(reservation.origin_type),
    reservationType: normalizeText(reservation.reservation_type),
    bookingDate: reservation.booking_date,
    issueDate: reservation.issue_date,
    travelDate: reservation.travel_date,
    embarkTime: normalizeText(reservation.embark_time).slice(0, 5),
    paymentType: normalizeText(reservation.payment_type),
    paymentStatus: normalizeText(reservation.payment_status),
    totalAmount: Number(reservation.total_amount ?? 0),
    currency: normalizeText(reservation.currency) || "COP",
    seasonType: normalizeText(reservation.season_type) || "low",
    notesSummary: normalizeText(reservation.notes_summary),
    createdAt: reservation.created_at,
    updatedAt: reservation.updated_at,
    expiresAt: resolveReservationExpiresAt(
      reservation.status,
      reservation.created_at,
      reservation.expires_at,
    ),
    parentReservationId: reservation.parent_reservation_id,
    canViewInternalPaymentHistory,
    couponCode: normalizeText(reservation.coupon_code) || null,
    discountPercentage: Number(reservation.discount_percentage ?? 0) || null,
    product: {
      id: reservation.product_id,
      name: product?.nombre || "Producto sin nombre",
      city: normalizeText(product?.ciudad),
      departureTime: normalizeText(product?.hora_salida).slice(0, 5),
      meetingPoint: normalizeText(product?.punto_encuentro),
      category: normalizeText(product?.category_key),
      subcategory: subcategoryName,
      summary: normalizeText(productDetailResponse.data?.summary),
      imageUrl: galleryResponse?.data?.image_url ? normalizeText(galleryResponse.data.image_url) : null,
    },
    sellerAgency: {
      id: reservation.seller_agency_id,
      name: sellerAgency?.nombre || "Agencia no disponible",
    },
    ownerAgency: {
      id: reservation.product_owner_agency_id,
      name: ownerAgency?.nombre || "Agencia no disponible",
    },
    createdBy: {
      id: reservation.created_by_user_id,
      name: createDisplayName(creator),
    },
    passengers: (passengersResponse.data ?? []).map((passenger) => ({
      id: passenger.id,
      fullName: `${passenger.first_name} ${passenger.last_name}`.trim(),
      passengerType: normalizeText(passenger.passenger_type),
      documentType: normalizeText(passenger.document_type),
      documentNumber: normalizeText(passenger.document_number),
      country: normalizeText(passenger.country),
      sex: normalizeText(passenger.sex),
      birthDate: passenger.birth_date,
      phone: normalizeText(passenger.phone),
      passengerStatus: normalizeText(passenger.passenger_status),
      chargedRate: passenger.charged_rate != null ? Number(passenger.charged_rate) : null,
    })),
    statusHistory,
    paymentHistory,
    activityHistory,
    notes: (notesResponse.data ?? []).map((entry) => ({
      id: entry.id,
      body: normalizeText(entry.body),
      createdAt: entry.created_at,
      createdByName: createDisplayName(usersById.get(entry.created_by_user_id)),
    })),
  };
}

export async function createReservationInSupabase({
  productId,
  travelDate,
  paymentType,
  paymentStatus = "pending",
  totalAmount,
  status = "reserved",
  notesSummary = "",
  passengers = [],
  couponCode = null,
  discountPercentage = null,
}) {
  const normalizedProductId = normalizeProductId(productId);
  const normalizedPassengers = normalizePassengerDrafts(passengers);
  validateReservationDraft({
    productId: normalizedProductId,
    travelDate,
    totalAmount,
    paymentType,
    passengers: normalizedPassengers,
  });

  const normalizedTravelDate = formatDateKey(parseDateInput(travelDate));
  const actorContext = await getAuthenticatedReservationActorContext();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, nombre, provider_agency_id, hora_salida, status")
    .eq("id", normalizedProductId)
    .maybeSingle();

  if (productError) {
    throw productError;
  }

  if (!product) {
    throw new Error("No encontramos el producto seleccionado para la reserva.");
  }

  if (normalizeText(product.status) !== "active") {
    throw new Error("Solo puedes reservar productos que hoy esten activos.");
  }

  const operationalState = await getProductOperationalState(
    normalizedProductId,
    normalizedTravelDate,
  );

  if (!operationalState.isWithinActiveRange) {
    throw new Error(
      "La fecha elegida esta fuera de los rangos activos del producto.",
    );
  }

  if (!operationalState.isOperable) {
    throw new Error(
      operationalState.blockedReason ||
        "La fecha elegida no esta operable para recibir reservas.",
    );
  }

  const normalizedEmbarkTime =
    normalizeClockTime(product.hora_salida) || "00:00:00";
  const expiresAt = getReservationExpirationDateTime(new Date());

  if (normalizeText(status) === "reserved" &&
      isReservationWithinLast24Hours(
        normalizedTravelDate,
        normalizedEmbarkTime,
        new Date(),
      )) {
    throw createEmitOnlyReservationError();
  }

  const [locator, seasonType] = await Promise.all([
    createUniqueLocator(),
    resolveSeasonType(normalizedProductId, normalizedTravelDate),
  ]);
  await resolveTravelDateCapacityForReservation({
    productId: normalizedProductId,
    travelDate: normalizedTravelDate,
    requestedPassengerCount: normalizedPassengers.length,
  });
  const reservationPayload = {
    locator,
    product_id: normalizedProductId,
    product_owner_agency_id: product.provider_agency_id,
    seller_agency_id: actorContext.sellerAgencyId,
    created_by_user_id: actorContext.userId,
    origin_type: "direct",
    status: normalizeText(status) || "reserved",
    reservation_type: "full",
    booking_date: getTodayKey(),
    issue_date: normalizeText(status) === "issued" ? getTodayKey() : null,
    travel_date: normalizedTravelDate,
    embark_time: normalizedEmbarkTime.slice(0, 5) || "00:00",
    payment_type: normalizeText(paymentType),
    payment_status: normalizeText(paymentStatus) || "pending",
    total_amount: parseAmount(totalAmount),
    currency: "COP",
    season_type: seasonType,
    notes_summary: normalizeText(notesSummary) || null,
    expires_at: normalizeText(status) === "reserved" ? expiresAt?.toISOString() ?? null : null,
    coupon_code: normalizeText(couponCode) || null,
    discount_percentage: discountPercentage != null ? Number(discountPercentage) : null,
  };
  const { data: createdReservation, error: reservationError } = await supabase
    .from("reservations")
    .insert(reservationPayload)
    .select("id")
    .single();

  if (reservationError) {
    throw reservationError;
  }

  const reservationId = createdReservation.id;
  const passengerRows = normalizedPassengers.map((passenger) => ({
    reservation_id: reservationId,
    ...passenger,
  }));
  const statusHistoryRow = {
    reservation_id: reservationId,
    previous_status: null,
    new_status: reservationPayload.status,
    reason: "Reserva creada desde el panel de control.",
    changed_by_user_id: actorContext.userId,
  };
  const [passengersInsert, historyInsert] = await Promise.all([
    supabase.from("reservation_passengers").insert(passengerRows),
    supabase.from("reservation_status_history").insert(statusHistoryRow),
  ]);

  if (passengersInsert.error) {
    throw passengersInsert.error;
  }

  if (historyInsert.error) {
    throw historyInsert.error;
  }

  return fetchReservationDetailFromSupabase(reservationId);
}

export async function createReservationCheckoutInSupabase({
  productId,
  travelDate,
  paymentType = "pasarela_pendiente",
  paymentStatus = "pending",
  totalAmount,
  notesSummary = "",
  passengers = [],
  locatorPreview = "",
  checkoutSnapshot = {},
  couponCode = null,
  discountPercentage = null,
}) {
  const normalizedProductId = normalizeProductId(productId);
  const normalizedPassengers = normalizePassengerDrafts(passengers);

  validateReservationDraft({
    productId: normalizedProductId,
    travelDate,
    totalAmount,
    paymentType,
    passengers: normalizedPassengers,
  });

  const normalizedTravelDate = formatDateKey(parseDateInput(travelDate));
  const actorContext = await getAuthenticatedReservationActorContext();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, nombre, provider_agency_id, hora_salida, status")
    .eq("id", normalizedProductId)
    .maybeSingle();

  if (productError) {
    throw productError;
  }

  if (!product) {
    throw new Error("No encontramos el producto seleccionado para la reserva.");
  }

  if (normalizeText(product.status) !== "active") {
    throw new Error("Solo puedes reservar productos que hoy esten activos.");
  }

  const operationalState = await getProductOperationalState(
    normalizedProductId,
    normalizedTravelDate,
  );

  if (!operationalState.isWithinActiveRange) {
    throw new Error(
      "La fecha elegida esta fuera de los rangos activos del producto.",
    );
  }

  if (!operationalState.isOperable) {
    throw new Error(
      operationalState.blockedReason ||
        "La fecha elegida no esta operable para recibir reservas.",
    );
  }

  const normalizedEmbarkTime =
    normalizeClockTime(product.hora_salida) || "00:00:00";

  if (
    isReservationWithinLast24Hours(
      normalizedTravelDate,
      normalizedEmbarkTime,
      new Date(),
    )
  ) {
    throw createEmitOnlyReservationError();
  }

  const [seasonType] = await Promise.all([
    resolveSeasonType(normalizedProductId, normalizedTravelDate),
    resolveTravelDateCapacityForReservation({
      productId: normalizedProductId,
      travelDate: normalizedTravelDate,
      requestedPassengerCount: normalizedPassengers.length,
    }),
  ]);

  let locator = normalizeText(locatorPreview).toUpperCase();

  if (!locator) {
    locator = await createUniqueLocator();
  } else {
    const { data: existingLocatorRows, error: locatorError } = await supabase
      .from("reservations")
      .select("id")
      .eq("locator", locator)
      .limit(1);

    if (locatorError) {
      throw locatorError;
    }

    if ((existingLocatorRows?.length ?? 0) > 0) {
      locator = await createUniqueLocator();
    }
  }

  const { data: reservationId, error: reservationRpcError } = await supabase.rpc(
    "create_reservation_checkout",
    {
      p_locator: locator,
      p_product_id: normalizedProductId,
      p_product_owner_agency_id: product.provider_agency_id,
      p_seller_agency_id: actorContext.sellerAgencyId,
      p_status: "reserved",
      p_booking_date: getTodayKey(),
      p_issue_date: null,
      p_travel_date: normalizedTravelDate,
      p_embark_time: normalizedEmbarkTime.slice(0, 5) || "00:00",
      p_payment_type: normalizeText(paymentType) || "pasarela_pendiente",
      p_payment_status: normalizeText(paymentStatus) || "pending",
      p_total_amount: parseAmount(totalAmount),
      p_currency: "COP",
      p_season_type: seasonType,
      p_notes_summary: normalizeText(notesSummary) || null,
      p_passengers: normalizedPassengers,
      p_checkout_snapshot: checkoutSnapshot ?? {},
      p_coupon_code: normalizeText(couponCode) || null,
      p_discount_percentage: discountPercentage != null ? Number(discountPercentage) : null,
    },
  );

  if (reservationRpcError) {
    throw reservationRpcError;
  }

  const reservationDetail = await fetchReservationDetailFromSupabase(reservationId);

  return {
    ...reservationDetail,
    paymentGatewayReady: false,
  };
}

export async function cancelReservationInSupabase({ reservationId, reasonNotes = "" }) {
  const normalizedReservationId = normalizeText(reservationId);
  const normalizedNotes = normalizeText(reasonNotes);

  if (!normalizedReservationId) {
    throw new Error("No encontramos la reserva que quieres cancelar.");
  }

  const actorContext = await getAuthenticatedReservationActorContext();

  const { data: reservationRow, error: reservationError } = await supabase
    .from("reservations")
    .select("status")
    .eq("id", normalizedReservationId)
    .maybeSingle();

  if (reservationError) {
    throw reservationError;
  }

  if (!reservationRow) {
    throw new Error("La reserva ya no existe o no tienes acceso a ella.");
  }

  const currentStatus = normalizeText(reservationRow.status);
  
  if (currentStatus === "cancelled_by_user" || currentStatus === "cancelled_by_expiration") {
    throw new Error("Esta reserva ya se encuentra cancelada.");
  }

  const { error: updateError } = await supabase
    .from("reservations")
    .update({ 
      status: "cancelled_by_user", 
      expires_at: null,
      updated_at: new Date().toISOString() 
    })
    .eq("id", normalizedReservationId);

  if (updateError) {
    throw updateError;
  }

  const statusHistoryRow = {
    reservation_id: normalizedReservationId,
    previous_status: currentStatus,
    new_status: "cancelled_by_user",
    reason: normalizedNotes || "Reserva cancelada manualmente por el usuario.",
    changed_by_user_id: actorContext.userId,
    changed_at: new Date().toISOString()
  };

  await supabase.from("reservation_status_history").insert(statusHistoryRow);

  if (normalizedNotes) {
    await supabase.from("reservation_notes").insert({
      reservation_id: normalizedReservationId,
      body: `Motivo de cancelacion: ${normalizedNotes}`,
      created_by_user_id: actorContext.userId,
      created_at: new Date().toISOString()
    });
  }

  return fetchReservationDetailFromSupabase(normalizedReservationId);
}

