const RESERVATION_LEAD_HOURS = 24;
const RESERVATION_LEAD_MILLISECONDS =
  RESERVATION_LEAD_HOURS * 60 * 60 * 1000;

function normalizeText(value) {
  return String(value ?? "").trim();
}

function parseDateOnly(value) {
  const normalizedValue = normalizeText(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return null;
  }

  const [year, month, day] = normalizedValue.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day, 0, 0, 0, 0);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function normalizeClockTime(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return "";
  }

  const twelveHourMatch = normalizedValue.match(
    /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)/i,
  );

  if (twelveHourMatch) {
    let [, hours, minutes, seconds = "00", meridiem] = twelveHourMatch;
    let normalizedHours = Number.parseInt(hours, 10);

    if (normalizedHours === 12) {
      normalizedHours = 0;
    }

    if (String(meridiem).toUpperCase() === "PM") {
      normalizedHours += 12;
    }

    return `${String(normalizedHours).padStart(2, "0")}:${minutes}:${seconds}`;
  }

  const twentyFourHourMatch = normalizedValue.match(
    /(\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );

  if (!twentyFourHourMatch) {
    return "";
  }

  const [, hours, minutes, seconds = "00"] = twentyFourHourMatch;
  const normalizedHours = Number.parseInt(hours, 10);

  if (!Number.isInteger(normalizedHours) || normalizedHours < 0 || normalizedHours > 23) {
    return "";
  }

  return `${String(normalizedHours).padStart(2, "0")}:${minutes}:${seconds}`;
}

export function buildActivityDateTime(travelDate, departureTime) {
  const parsedDate = parseDateOnly(travelDate);
  const normalizedTime = normalizeClockTime(departureTime);

  if (!parsedDate || !normalizedTime) {
    return null;
  }

  const [hours, minutes, seconds] = normalizedTime.split(":").map(Number);
  const activityAt = new Date(parsedDate);

  activityAt.setHours(hours, minutes, seconds ?? 0, 0);

  return Number.isNaN(activityAt.getTime()) ? null : activityAt;
}

function normalizeCreatedAt(createdAt) {
  if (!createdAt) {
    return new Date();
  }

  if (createdAt instanceof Date) {
    return Number.isNaN(createdAt.getTime()) ? new Date() : createdAt;
  }

  const parsedDate = new Date(createdAt);
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}

export function getReservationExpirationDateTime(
  createdAt = new Date(),
) {
  const createdAtDate = normalizeCreatedAt(createdAt);
  return new Date(
    createdAtDate.getTime() + RESERVATION_LEAD_MILLISECONDS,
  );
}

export function isReservationWithinLast24Hours(
  travelDate,
  departureTime,
  createdAt = new Date(),
) {
  const activityAt = buildActivityDateTime(travelDate, departureTime);

  if (!activityAt) {
    return false;
  }

  const activityCutoff = new Date(
    activityAt.getTime() - RESERVATION_LEAD_MILLISECONDS,
  );

  return normalizeCreatedAt(createdAt).getTime() >= activityCutoff.getTime();
}

export function toIsoDateTimeLocal(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
