export function normalizeProductId(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "boolean") {
    return "";
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return String(numericValue);
  }

  return "";
}

export function hasProductId(value) {
  return normalizeProductId(value).length > 0;
}

export function isSameProductId(leftValue, rightValue) {
  const normalizedLeftValue = normalizeProductId(leftValue);
  const normalizedRightValue = normalizeProductId(rightValue);

  return Boolean(normalizedLeftValue) && normalizedLeftValue === normalizedRightValue;
}
