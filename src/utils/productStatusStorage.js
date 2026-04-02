const PRODUCT_STATUS_STORAGE_KEY = "lds-panel-control-product-statuses";
const PRODUCT_STATUS_CHANGE_EVENT = "lds-product-status-changed";

function canUseStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function normalizeProductStatus(status) {
  return status === "inactive" ? "inactive" : "active";
}

function readStoredProductStatuses() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(PRODUCT_STATUS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter(
        (item) =>
          item &&
          Number.isFinite(Number(item.productId)) &&
          typeof item.status === "string",
      )
      .map((item) => ({
        productId: Number(item.productId),
        status: normalizeProductStatus(item.status),
      }));
  } catch {
    return [];
  }
}

function writeStoredProductStatuses(records) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    PRODUCT_STATUS_STORAGE_KEY,
    JSON.stringify(records),
  );
}

function emitProductStatusChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new window.Event(PRODUCT_STATUS_CHANGE_EVENT));
}

export function getProductStatusRecords() {
  return readStoredProductStatuses();
}

export function getResolvedProductStatus(productId, fallbackStatus = "active") {
  const matchedStatus = readStoredProductStatuses().find(
    (item) => item.productId === Number(productId),
  );

  return matchedStatus?.status ?? normalizeProductStatus(fallbackStatus);
}

export function persistProductStatus(productId, status) {
  const normalizedStatus = normalizeProductStatus(status);
  const normalizedProductId = Number(productId);
  const storedRecords = readStoredProductStatuses();
  const recordIndex = storedRecords.findIndex(
    (item) => item.productId === normalizedProductId,
  );
  const nextRecord = {
    productId: normalizedProductId,
    status: normalizedStatus,
  };
  const nextRecords =
    recordIndex >= 0
      ? storedRecords.map((item, index) =>
          index === recordIndex ? nextRecord : item,
        )
      : [...storedRecords, nextRecord];

  writeStoredProductStatuses(nextRecords);
  emitProductStatusChange();

  return normalizedStatus;
}

export function subscribeToProductStatusChanges(onChange) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event) => {
    if (event.key && event.key !== PRODUCT_STATUS_STORAGE_KEY) {
      return;
    }

    onChange();
  };

  const handleFocus = () => {
    onChange();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      onChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener("focus", handleFocus);
  window.addEventListener(PRODUCT_STATUS_CHANGE_EVENT, handleFocus);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("focus", handleFocus);
    window.removeEventListener(PRODUCT_STATUS_CHANGE_EVENT, handleFocus);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
