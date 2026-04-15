import {
  normalizeProductId,
} from "./productIds";

const MAX_PRODUCT_GALLERY_IMAGES = 5;

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

export function createProductGallerySlots(images = [], totalSlots = MAX_PRODUCT_GALLERY_IMAGES) {
  const normalizedImages = normalizeGalleryImages(images, "draft");

  return Array.from({ length: totalSlots }, (_, index) => ({
    slot: index,
    image: normalizedImages[index] ?? null,
  }));
}

export { MAX_PRODUCT_GALLERY_IMAGES };
