const RESERVATION_DRAFT_STORAGE_KEY = "lds-reservation-draft";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

export function saveReservationDraft(draft) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(
    RESERVATION_DRAFT_STORAGE_KEY,
    JSON.stringify({
      ...draft,
      savedAt: new Date().toISOString(),
    }),
  );
}

export function readReservationDraft() {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(RESERVATION_DRAFT_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (_error) {
    storage.removeItem(RESERVATION_DRAFT_STORAGE_KEY);
    return null;
  }
}

export function clearReservationDraft() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(RESERVATION_DRAFT_STORAGE_KEY);
}
