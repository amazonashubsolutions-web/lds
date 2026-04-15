export const DEFAULT_USER_PHOTO_FILENAME = "new_user.png";

export function normalizeUserPhotoFilename(value) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return "";
  }

  if (normalizedValue.startsWith("/images/user/")) {
    return decodeURIComponent(normalizedValue.replace("/images/user/", ""));
  }

  if (/^https?:\/\//i.test(normalizedValue)) {
    const lastSegment = normalizedValue.split("/").pop();
    return decodeURIComponent(lastSegment || "");
  }

  return normalizedValue;
}

export function resolveUserPhotoUrl(value) {
  const normalizedFilename =
    normalizeUserPhotoFilename(value) || DEFAULT_USER_PHOTO_FILENAME;

  return `/images/user/${encodeURIComponent(normalizedFilename)}`;
}
