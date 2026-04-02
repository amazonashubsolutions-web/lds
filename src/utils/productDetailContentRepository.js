const PRODUCT_DETAIL_CONTENT_STORAGE_KEY = "lds-panel-control-product-detail-content";

function canUseStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeParagraphList(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => normalizeText(item)).filter(Boolean);
}

function normalizeLabeledItems(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => ({
      id:
        typeof item?.id === "string" && item.id.trim()
          ? item.id.trim()
          : `item-${index + 1}`,
      day: normalizeText(item?.day),
      title: normalizeText(item?.title),
      description: normalizeText(item?.description),
    }))
    .filter((item) => item.title || item.description || item.day);
}

function normalizePriceValue(value) {
  return normalizeText(value).replace(/\D/g, "");
}

function normalizeBookingPriceItems(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => ({
      id:
        typeof item?.id === "string" && item.id.trim()
          ? item.id.trim()
          : `price-${index + 1}`,
      label: normalizeText(item?.label),
      ageHint: normalizeText(item?.ageHint),
      price: normalizePriceValue(item?.price),
    }))
    .filter((item) => item.label || item.price);
}

function normalizeBookingPeriods(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => ({
      id:
        typeof item?.id === "string" && item.id.trim()
          ? item.id.trim()
          : `period-${index + 1}`,
      label: normalizeText(item?.label),
      startMonthDay: normalizeText(item?.startMonthDay),
      endMonthDay: normalizeText(item?.endMonthDay),
    }))
    .filter((item) => item.label || item.startMonthDay || item.endMonthDay);
}

function normalizeBookingSeason(season) {
  if (!season || typeof season !== "object") {
    return null;
  }

  return {
    title: normalizeText(season.title),
    note: normalizeText(season.note),
    periods: normalizeBookingPeriods(season.periods),
    individual: normalizeBookingPriceItems(season.individual),
    group: normalizeBookingPriceItems(season.group),
  };
}

function normalizeBookingRecord(booking = {}) {
  const seasons = booking?.pricingDetails?.seasons;

  return {
    productId: Number(booking?.productId) || 0,
    price: normalizePriceValue(booking?.price),
    unitLabel: normalizeText(booking?.unitLabel),
    buttonLabel: normalizeText(booking?.buttonLabel),
    passengerFields: Array.isArray(booking?.passengerFields)
      ? booking.passengerFields.map((field, index) => ({
          id:
            typeof field?.id === "string" && field.id.trim()
              ? field.id.trim()
              : `passenger-${index + 1}`,
          label: normalizeText(field?.label),
          ageHint: normalizeText(field?.ageHint),
          min: Number.isFinite(Number(field?.min)) ? Number(field.min) : 0,
          defaultValue: Number.isFinite(Number(field?.defaultValue))
            ? Number(field.defaultValue)
            : 0,
        }))
      : [],
    pricingDetails: {
      groupMinPassengers: Number.isFinite(
        Number(booking?.pricingDetails?.groupMinPassengers),
      )
        ? Number(booking.pricingDetails.groupMinPassengers)
        : 0,
      groupRule: normalizeText(booking?.pricingDetails?.groupRule),
      seasons: seasons
        ? {
            low: normalizeBookingSeason(seasons.low),
            high: normalizeBookingSeason(seasons.high),
          }
        : null,
      individual: normalizeBookingPriceItems(booking?.pricingDetails?.individual),
      group: normalizeBookingPriceItems(booking?.pricingDetails?.group),
    },
    note: normalizeText(booking?.note),
    additionalCharges: Array.isArray(booking?.additionalCharges)
      ? booking.additionalCharges.map((charge, index) => ({
          label: normalizeText(charge?.label) || `Cargo ${index + 1}`,
          value: normalizePriceValue(charge?.value),
          type: normalizeText(charge?.type),
        }))
      : [],
  };
}

function readStoredRecords() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(
      PRODUCT_DETAIL_CONTENT_STORAGE_KEY,
    );

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function writeStoredRecords(records) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    PRODUCT_DETAIL_CONTENT_STORAGE_KEY,
    JSON.stringify(records),
  );
}

function normalizeContentRecord(productId, content = {}) {
  return {
    productId: Number(productId),
    title: normalizeText(content.title),
    summary: normalizeText(content.summary),
    overview: normalizeParagraphList(content.overview),
    itinerary: normalizeLabeledItems(content.itinerary),
    includes: normalizeLabeledItems(content.includes),
    excludes: normalizeLabeledItems(content.excludes),
    recommendations: normalizeParagraphList(content.recommendations),
    considerations: normalizeParagraphList(content.considerations),
    cancellationPolicies: normalizeParagraphList(content.cancellationPolicies),
    booking: normalizeBookingRecord(content.booking),
  };
}

export function getStoredProductDetailContent(productId) {
  return (
    readStoredRecords().find(
      (record) => Number(record?.productId) === Number(productId),
    ) ?? null
  );
}

export function getResolvedProductDetailContent(productId, fallbackContent) {
  const storedRecord = getStoredProductDetailContent(productId);

  if (!storedRecord) {
    return normalizeContentRecord(productId, fallbackContent);
  }

  const normalizedFallback = normalizeContentRecord(productId, fallbackContent);

  return {
    ...normalizedFallback,
    ...storedRecord,
    overview: Array.isArray(storedRecord.overview)
      ? storedRecord.overview
      : normalizedFallback.overview,
    itinerary: Array.isArray(storedRecord.itinerary)
      ? storedRecord.itinerary
      : normalizedFallback.itinerary,
    includes: Array.isArray(storedRecord.includes)
      ? storedRecord.includes
      : normalizedFallback.includes,
    excludes: Array.isArray(storedRecord.excludes)
      ? storedRecord.excludes
      : normalizedFallback.excludes,
    recommendations: Array.isArray(storedRecord.recommendations)
      ? storedRecord.recommendations
      : normalizedFallback.recommendations,
    considerations: Array.isArray(storedRecord.considerations)
      ? storedRecord.considerations
      : normalizedFallback.considerations,
    cancellationPolicies: Array.isArray(storedRecord.cancellationPolicies)
      ? storedRecord.cancellationPolicies
      : normalizedFallback.cancellationPolicies,
    booking: storedRecord.booking
      ? normalizeBookingRecord(storedRecord.booking)
      : normalizedFallback.booking,
  };
}

export function persistProductDetailContent(productId, content) {
  const nextRecord = normalizeContentRecord(productId, content);
  const storedRecords = readStoredRecords();
  const existingIndex = storedRecords.findIndex(
    (record) => Number(record?.productId) === Number(productId),
  );
  const nextRecords =
    existingIndex >= 0
      ? storedRecords.map((record, index) =>
          index === existingIndex ? nextRecord : record,
        )
      : [...storedRecords, nextRecord];

  writeStoredRecords(nextRecords);

  return nextRecord;
}
