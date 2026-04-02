const CREATED_PRODUCTS_STORAGE_KEY = "lds-panel-control-created-products";

function canUseStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTimeToMeridiem(value) {
  const normalizedValue = normalizeText(value);
  const timeMatch = normalizedValue.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);

  if (!timeMatch) {
    return normalizedValue;
  }

  const hours24 = Number(timeMatch[1]);
  const minutes = timeMatch[2];
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${minutes} ${meridiem}`;
}

function normalizeStringList(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => normalizeText(item)).filter(Boolean);
}

function normalizeObjectList(items = [], fallbackPrefix = "item") {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => ({
      id:
        typeof item?.id === "string" && item.id.trim()
          ? item.id.trim()
          : `${fallbackPrefix}-${index + 1}`,
      day: normalizeText(item?.day),
      title: normalizeText(item?.title),
      description: normalizeText(item?.description),
    }))
    .filter((item) => item.day || item.title || item.description);
}

function normalizeMetaList(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => ({
      id:
        typeof item?.id === "string" && item.id.trim()
          ? item.id.trim()
          : `meta-${index + 1}`,
      label: normalizeText(item?.label),
      value:
        normalizeText(item?.label) === "Hora de salida" ||
        normalizeText(item?.label) === "Hora de regreso"
          ? normalizeTimeToMeridiem(item?.value)
          : normalizeText(item?.value),
    }))
    .filter((item) => item.label && item.value);
}

function normalizePriceValue(value) {
  return normalizeText(value).replace(/\D/g, "");
}

function parseAmountValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const digits = normalizePriceValue(value);
  return digits ? Number(digits) : 0;
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

function normalizeBooking(booking = {}) {
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
      seasons: booking?.pricingDetails?.seasons
        ? {
            low: normalizeBookingSeason(booking.pricingDetails.seasons.low),
            high: normalizeBookingSeason(booking.pricingDetails.seasons.high),
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

function normalizeProduct(product = {}) {
  return {
    id: Number(product?.id) || 0,
    name: normalizeText(product?.name),
    city: normalizeText(product?.city),
    region: normalizeText(product?.region),
    categoryId: normalizeText(product?.categoryId),
    basePriceAmount: parseAmountValue(product?.basePriceAmount),
    currencyCode: normalizeText(product?.currencyCode) || "COP",
    isFeatured: Boolean(product?.isFeatured),
    status: normalizeText(product?.status) === "active" ? "active" : "inactive",
    coverImageUrl: normalizeText(product?.coverImageUrl),
    pricingLabel: normalizeText(product?.pricingLabel) || "Desde",
    pricingUnitLabel: normalizeText(product?.pricingUnitLabel) || "persona",
  };
}

function normalizeDetail(detail = {}, productId = 0) {
  return {
    id: normalizeText(detail?.id) || `PDT-CREATED-${productId}`,
    productId,
    slug: normalizeText(detail?.slug),
    eyebrow: normalizeText(detail?.eyebrow),
    galleryImageUrls: normalizeStringList(detail?.galleryImageUrls),
    summary: normalizeText(detail?.summary),
    meta: normalizeMetaList(detail?.meta),
    overview: normalizeStringList(detail?.overview),
    includes: normalizeObjectList(detail?.includes, "include"),
    excludes: normalizeObjectList(detail?.excludes, "exclude"),
    recommendations: normalizeStringList(detail?.recommendations),
    considerations: normalizeStringList(detail?.considerations),
    cancellationPolicies: normalizeStringList(detail?.cancellationPolicies),
    itinerary: normalizeObjectList(detail?.itinerary, "itinerary"),
    booking: normalizeBooking(detail?.booking),
  };
}

function normalizeCreatedProductRecord(record = {}) {
  const product = normalizeProduct(record.product);
  const subcategoryIds = normalizeStringList(record.subcategoryIds);
  const detail = normalizeDetail(record.detail, product.id);
  const normalizedBasePrice = parseAmountValue(detail.booking?.price);

  return {
    product: {
      ...product,
      basePriceAmount:
        product.basePriceAmount > 0
          ? Math.max(product.basePriceAmount, normalizedBasePrice)
          : normalizedBasePrice,
    },
    subcategoryIds,
    detail,
  };
}

function readStoredRecords() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(CREATED_PRODUCTS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((record) => normalizeCreatedProductRecord(record))
      .filter((record) => record.product.id > 0);
  } catch {
    return [];
  }
}

function writeStoredRecords(records) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    CREATED_PRODUCTS_STORAGE_KEY,
    JSON.stringify(records),
  );
}

export function getStoredCreatedProductRecords() {
  return readStoredRecords();
}

export function getStoredCreatedProductRecordById(productId) {
  return (
    readStoredRecords().find(
      (record) => Number(record.product.id) === Number(productId),
    ) ?? null
  );
}

export function getStoredCreatedProductRecordBySlug(slug) {
  const normalizedSlug = normalizeText(slug);

  if (!normalizedSlug) {
    return null;
  }

  return (
    readStoredRecords().find((record) => record.detail.slug === normalizedSlug) ??
    null
  );
}

export function persistCreatedProductRecord(record) {
  const normalizedRecord = normalizeCreatedProductRecord(record);
  const storedRecords = readStoredRecords();
  const existingIndex = storedRecords.findIndex(
    (item) => item.product.id === normalizedRecord.product.id,
  );
  const nextRecords =
    existingIndex >= 0
      ? storedRecords.map((item, index) =>
          index === existingIndex ? normalizedRecord : item,
        )
      : [...storedRecords, normalizedRecord];

  writeStoredRecords(nextRecords);

  return normalizedRecord;
}

export function getNextCreatedProductId(baseProductIds = []) {
  const storedIds = readStoredRecords().map((record) => record.product.id);
  const maxId = [...baseProductIds, ...storedIds].reduce(
    (currentMax, currentValue) =>
      Number(currentValue) > currentMax ? Number(currentValue) : currentMax,
    0,
  );

  return maxId + 1;
}
