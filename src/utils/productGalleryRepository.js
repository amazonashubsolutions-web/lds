const PRODUCT_GALLERY_STORAGE_KEY = "lds-panel-control-product-galleries";
const MAX_PRODUCT_GALLERY_IMAGES = 5;

function canUseStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function createGalleryImageId(productId, position) {
  return `product-${productId}-gallery-${position + 1}`;
}

function extractFileNameFromUrl(url) {
  if (typeof url !== "string" || !url.trim()) {
    return "";
  }

  const normalizedUrl = url.trim();
  const pathSegments = normalizedUrl.split("/");
  const lastSegment = pathSegments[pathSegments.length - 1] ?? "";

  try {
    return decodeURIComponent(lastSegment);
  } catch {
    return lastSegment;
  }
}

function normalizeGalleryImage(image, productId, index) {
  if (!image) {
    return null;
  }

  const normalizedUrl =
    typeof image === "string"
      ? image.trim()
      : typeof image.url === "string"
        ? image.url.trim()
        : "";

  if (!normalizedUrl) {
    return null;
  }

  const normalizedPosition = Number.isFinite(Number(image.position))
    ? Number(image.position)
    : index;

  return {
    id:
      typeof image === "object" && typeof image.id === "string" && image.id.trim()
        ? image.id.trim()
        : createGalleryImageId(productId, normalizedPosition),
    url: normalizedUrl,
    position: normalizedPosition,
    isPrimary:
      typeof image === "object" && typeof image.isPrimary === "boolean"
        ? image.isPrimary
        : normalizedPosition === 0,
    fileName:
      typeof image === "object" && typeof image.fileName === "string"
        ? image.fileName.trim()
        : extractFileNameFromUrl(normalizedUrl),
  };
}

function normalizeGalleryImages(images = [], productId) {
  const normalizedImages = images
    .map((image, index) => normalizeGalleryImage(image, productId, index))
    .filter(Boolean)
    .sort((left, right) => left.position - right.position)
    .slice(0, MAX_PRODUCT_GALLERY_IMAGES)
    .map((image, index) => ({
      ...image,
      position: index,
      isPrimary: index === 0,
    }));

  return normalizedImages;
}

function readStoredProductGalleries() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(PRODUCT_GALLERY_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter((record) => Number.isFinite(Number(record?.productId)))
      .map((record) => ({
        productId: Number(record.productId),
        images: normalizeGalleryImages(record.images, Number(record.productId)),
      }));
  } catch {
    return [];
  }
}

function writeStoredProductGalleries(records) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    PRODUCT_GALLERY_STORAGE_KEY,
    JSON.stringify(records),
  );
}

function buildFallbackGallery(productId, baseImages = [], fallbackCoverImageUrl = "") {
  const normalizedBaseImages = normalizeGalleryImages(baseImages, productId);

  if (normalizedBaseImages.length > 0) {
    return normalizedBaseImages;
  }

  return normalizeGalleryImages(
    fallbackCoverImageUrl ? [fallbackCoverImageUrl] : [],
    productId,
  );
}

export function getStoredProductGallery(productId) {
  return (
    readStoredProductGalleries().find(
      (record) => record.productId === Number(productId),
    ) ?? null
  );
}

export function getResolvedProductGallery({
  productId,
  baseImages = [],
  fallbackCoverImageUrl = "",
}) {
  const storedGallery = getStoredProductGallery(productId);

  if (storedGallery?.images?.length) {
    return storedGallery.images;
  }

  return buildFallbackGallery(productId, baseImages, fallbackCoverImageUrl);
}

export function getResolvedProductGalleryUrls(options) {
  return getResolvedProductGallery(options).map((image) => image.url);
}

export function createProductGallerySlots(images = [], totalSlots = MAX_PRODUCT_GALLERY_IMAGES) {
  const normalizedImages = normalizeGalleryImages(images, "draft");

  return Array.from({ length: totalSlots }, (_, index) => ({
    slot: index,
    image: normalizedImages[index] ?? null,
  }));
}

export function persistProductGallery(productId, images = []) {
  const normalizedProductId = Number(productId);
  const normalizedImages = normalizeGalleryImages(images, normalizedProductId);
  const storedGalleries = readStoredProductGalleries();
  const existingGalleryIndex = storedGalleries.findIndex(
    (record) => record.productId === normalizedProductId,
  );
  const nextRecord = {
    productId: normalizedProductId,
    images: normalizedImages,
  };
  const nextRecords =
    existingGalleryIndex >= 0
      ? storedGalleries.map((record, index) =>
          index === existingGalleryIndex ? nextRecord : record,
        )
      : [...storedGalleries, nextRecord];

  writeStoredProductGalleries(nextRecords);

  return nextRecord;
}

export { MAX_PRODUCT_GALLERY_IMAGES };
