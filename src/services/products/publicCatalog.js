import { supabase } from "../../lib/supabase/client.js";

const CATEGORY_LABELS = {
  actividades: "Actividades",
  transporte: "Transporte",
  restaurantes: "Restaurantes",
  planes: "Planes",
  excursiones: "Excursiones",
};

function parsePriceValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function formatLocationLabel(product) {
  return [product.ciudad, product.region].filter(Boolean).join(", ");
}

function formatTimeLabel(value) {
  const normalizedValue = String(value ?? "").trim();
  const matchedValue = normalizedValue.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);

  if (!matchedValue) {
    return "";
  }

  const hours24 = Number(matchedValue[1]);
  const minutes = matchedValue[2];
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${minutes} ${meridiem}`;
}

function pickPrimaryImage(galleryRows, fallbackCoverImageUrl = "") {
  if (!Array.isArray(galleryRows) || galleryRows.length === 0) {
    return fallbackCoverImageUrl;
  }

  const sortedRows = [...galleryRows].sort((left, right) => {
    if (left.is_primary === right.is_primary) {
      return Number(left.position ?? 0) - Number(right.position ?? 0);
    }

    return left.is_primary ? -1 : 1;
  });

  return sortedRows[0]?.image_url || fallbackCoverImageUrl;
}

function normalizeMetaEntries(meta) {
  return Array.isArray(meta) ? meta.filter(Boolean) : [];
}

function getMetaValue(metaEntries, label) {
  return (
    metaEntries.find((item) => String(item?.label ?? "").trim() === label)?.value ?? ""
  );
}

function normalizeGalleryEntries(productId, galleryRows) {
  return (galleryRows ?? [])
    .slice()
    .sort((left, right) => Number(left.position ?? 0) - Number(right.position ?? 0))
    .map((imageRow, index) => ({
      id:
        typeof imageRow.id === "string" && imageRow.id.trim()
          ? imageRow.id.trim()
          : `product-${productId}-gallery-${index + 1}`,
      url: imageRow.image_url,
      position: Number(imageRow.position ?? index),
      isPrimary: Boolean(imageRow.is_primary),
      fileName: imageRow.file_name ?? "",
    }));
}

function createFallbackBooking(productId, product, detailRow) {
  return {
    productId,
    price: String(parsePriceValue(detailRow?.booking_config?.price)),
    unitLabel: product.pricing_unit_label ? `por ${product.pricing_unit_label}` : "",
    buttonLabel: "Reservar ahora",
    passengerFields: [],
    pricingDetails: {
      groupMinPassengers: 0,
      groupRule: "",
      seasons: null,
      individual: [],
      group: [],
    },
    note: "",
    additionalCharges: [],
  };
}

function createFallbackDetailContent(productId, product, detailRow) {
  return {
    title: product.nombre,
    summary: detailRow?.summary ?? product.descripcion_breve ?? "",
    overview: Array.isArray(detailRow?.overview) ? detailRow.overview : [],
    itinerary: Array.isArray(detailRow?.itinerary) ? detailRow.itinerary : [],
    includes: Array.isArray(detailRow?.includes) ? detailRow.includes : [],
    excludes: Array.isArray(detailRow?.excludes) ? detailRow.excludes : [],
    recommendations: Array.isArray(detailRow?.recommendations)
      ? detailRow.recommendations
      : [],
    considerations: Array.isArray(detailRow?.considerations)
      ? detailRow.considerations
      : [],
    cancellationPolicies: Array.isArray(detailRow?.cancellation_policies)
      ? detailRow.cancellation_policies
      : [],
    booking:
      detailRow?.booking_config && typeof detailRow.booking_config === "object"
        ? detailRow.booking_config
        : createFallbackBooking(productId, product, detailRow),
  };
}

function buildDepartureDetails(product, detailRow, subcategoryIds) {
  const metaEntries = normalizeMetaEntries(detailRow?.meta);
  const departureTime =
    formatTimeLabel(product.hora_salida) ||
    String(getMetaValue(metaEntries, "Hora de salida") || "").trim() ||
    "Por definir";
  const departurePoint =
    String(product.punto_encuentro || "").trim() ||
    String(getMetaValue(metaEntries, "Punto de encuentro") || "").trim() ||
    (subcategoryIds.length > 0
      ? "Punto de encuentro por confirmar"
      : "Punto de encuentro por definir");

  return {
    departureTime,
    departurePoint,
  };
}

function buildResultsCardItem(
  product,
  detailByProductId,
  galleryByProductId,
  subcategoryEntriesByProductId,
) {
  const detail = detailByProductId.get(product.id);
  const bookingConfig = detail?.booking_config ?? {};
  const subcategoryEntries = subcategoryEntriesByProductId.get(product.id) ?? [];
  const subcategoryIds = subcategoryEntries.map((subcategory) => subcategory.id);

  return {
    id: product.id,
    routeKey: detail?.slug || product.id,
    title: product.nombre,
    location: formatLocationLabel(product),
    price: parsePriceValue(bookingConfig.price),
    status: product.status,
    featured: Boolean(product.is_featured),
    image: pickPrimaryImage(
      galleryByProductId.get(product.id) ?? [],
      product.cover_image_url ?? "",
    ),
    badgeLabel: product.is_featured ? "Destacado" : undefined,
    priceLabel: product.pricing_label,
    priceSuffix: product.pricing_unit_label ? `/ ${product.pricing_unit_label}` : "",
    categoryId: product.category_key,
    categoryLabel:
      CATEGORY_LABELS[product.category_key] ?? product.category_key ?? "Sin categoria",
    subcategoryIds,
    subcategoryLabels: subcategoryEntries.map((subcategory) => subcategory.label),
    ...buildDepartureDetails(product, detail, subcategoryIds),
  };
}

function buildPublicDetailView(product, detailRow, galleryRows, subcategoryEntries) {
  const productId = product.id;
  const normalizedGalleryEntries = normalizeGalleryEntries(productId, galleryRows);
  const resolvedContent = createFallbackDetailContent(productId, product, detailRow);
  const metaEntries = normalizeMetaEntries(detailRow?.meta);

  return {
    id: productId,
    detailId: productId,
    productId,
    slug: detailRow?.slug ?? productId,
    routeKey: detailRow?.slug ?? productId,
    categoryId: product.category_key,
    title: resolvedContent.title || product.nombre,
    location: formatLocationLabel(product),
    featured: Boolean(product.is_featured),
    status: product.status,
    eyebrow: detailRow?.eyebrow ?? "",
    galleryImages: normalizedGalleryEntries.map((image) => image.url),
    galleryEntries: normalizedGalleryEntries,
    summary: resolvedContent.summary,
    meta: metaEntries.map((item, index) => ({
      id:
        typeof item?.id === "string" && item.id.trim()
          ? item.id.trim()
          : `meta-${productId}-${index + 1}`,
      label: String(item?.label ?? "").trim(),
      value: String(item?.value ?? "").trim(),
    })),
    overview: resolvedContent.overview,
    includes: resolvedContent.includes,
    excludes: resolvedContent.excludes,
    recommendations: resolvedContent.recommendations,
    considerations: resolvedContent.considerations,
    cancellationPolicies: resolvedContent.cancellationPolicies,
    itinerary: resolvedContent.itinerary,
    booking: {
      ...(resolvedContent.booking ?? createFallbackBooking(productId, product, detailRow)),
      productId,
    },
    subcategoryIds: subcategoryEntries.map((subcategory) => subcategory.id),
    subcategoryLabels: subcategoryEntries.map((subcategory) => subcategory.label),
  };
}

function groupGalleryRowsByProductId(galleryRows) {
  const galleryByProductId = new Map();

  for (const galleryRow of galleryRows ?? []) {
    const rows = galleryByProductId.get(galleryRow.product_id) ?? [];
    rows.push(galleryRow);
    galleryByProductId.set(galleryRow.product_id, rows);
  }

  return galleryByProductId;
}

function groupSubcategoriesByProductId(links, subcategories) {
  const subcategoryById = new Map(
    (subcategories ?? []).map((subcategory) => [
      subcategory.id,
      {
        id: subcategory.subcategory_key,
        label: subcategory.nombre,
      },
    ]),
  );
  const subcategoriesByProductId = new Map();

  for (const link of links ?? []) {
    const matchedSubcategory = subcategoryById.get(link.product_subcategory_id);

    if (!matchedSubcategory) {
      continue;
    }

    const currentEntries = subcategoriesByProductId.get(link.product_id) ?? [];
    currentEntries.push(matchedSubcategory);
    subcategoriesByProductId.set(link.product_id, currentEntries);
  }

  return subcategoriesByProductId;
}

function getFirstResponseError(responses) {
  return responses.map((response) => response.error).find(Boolean) ?? null;
}

function isUuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value ?? "").trim(),
  );
}

export async function fetchPublicResultsCardsFromSupabase() {
  const [
    productsResponse,
    detailResponse,
    galleryResponse,
    subcategoriesResponse,
    linksResponse,
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, nombre, ciudad, region, punto_encuentro, hora_salida, category_key, pricing_label, pricing_unit_label, cover_image_url, is_featured, status",
      )
      .eq("status", "active")
      .order("nombre", { ascending: true }),
    supabase
      .from("product_detail_content")
      .select("product_id, slug, booking_config, meta"),
    supabase
      .from("product_gallery_images")
      .select("id, product_id, image_url, file_name, position, is_primary")
      .order("position", { ascending: true }),
    supabase
      .from("product_subcategories")
      .select("id, subcategory_key, nombre"),
    supabase
      .from("product_subcategory_links")
      .select("product_id, product_subcategory_id"),
  ]);

  const firstError = getFirstResponseError([
    productsResponse,
    detailResponse,
    galleryResponse,
    subcategoriesResponse,
    linksResponse,
  ]);

  if (firstError) {
    throw firstError;
  }

  const activeProducts = productsResponse.data ?? [];
  const activeProductIds = new Set(activeProducts.map((product) => product.id));

  const detailByProductId = new Map(
    (detailResponse.data ?? [])
      .filter((detail) => activeProductIds.has(detail.product_id))
      .map((detail) => [detail.product_id, detail]),
  );
  const galleryByProductId = groupGalleryRowsByProductId(
    (galleryResponse.data ?? []).filter((galleryRow) =>
      activeProductIds.has(galleryRow.product_id),
    ),
  );
  const subcategoryEntriesByProductId = groupSubcategoriesByProductId(
    (linksResponse.data ?? []).filter((link) => activeProductIds.has(link.product_id)),
    subcategoriesResponse.data ?? [],
  );

  return activeProducts.map((product) =>
    buildResultsCardItem(
      product,
      detailByProductId,
      galleryByProductId,
      subcategoryEntriesByProductId,
    ),
  );
}

export async function fetchPublicProductDetailFromSupabase(productIdOrSlug) {
  const normalizedRouteKey = String(productIdOrSlug ?? "").trim();

  if (!normalizedRouteKey) {
    return null;
  }

  let productId = "";
  let detailRow = null;

  if (isUuidLike(normalizedRouteKey)) {
    productId = normalizedRouteKey;
  } else {
    const detailResponse = await supabase
      .from("product_detail_content")
      .select(
        "product_id, slug, eyebrow, summary, meta, overview, itinerary, includes, excludes, recommendations, considerations, cancellation_policies, booking_config",
      )
      .eq("slug", normalizedRouteKey)
      .maybeSingle();

    if (detailResponse.error) {
      throw detailResponse.error;
    }

    if (!detailResponse.data?.product_id) {
      return null;
    }

    productId = detailResponse.data.product_id;
    detailRow = detailResponse.data;
  }

  const [
    productResponse,
    detailByProductIdResponse,
    galleryResponse,
    subcategoriesResponse,
    linksResponse,
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, nombre, ciudad, region, punto_encuentro, descripcion_breve, hora_salida, status, category_key, pricing_label, pricing_unit_label, cover_image_url, is_featured",
      )
      .eq("id", productId)
      .eq("status", "active")
      .maybeSingle(),
    detailRow
      ? Promise.resolve({ data: detailRow, error: null })
      : supabase
          .from("product_detail_content")
          .select(
            "product_id, slug, eyebrow, summary, meta, overview, itinerary, includes, excludes, recommendations, considerations, cancellation_policies, booking_config",
          )
          .eq("product_id", productId)
          .maybeSingle(),
    supabase
      .from("product_gallery_images")
      .select("id, product_id, image_url, file_name, position, is_primary")
      .eq("product_id", productId)
      .order("position", { ascending: true }),
    supabase
      .from("product_subcategories")
      .select("id, subcategory_key, nombre"),
    supabase
      .from("product_subcategory_links")
      .select("product_id, product_subcategory_id")
      .eq("product_id", productId),
  ]);

  const firstError = getFirstResponseError([
    productResponse,
    detailByProductIdResponse,
    galleryResponse,
    subcategoriesResponse,
    linksResponse,
  ]);

  if (firstError) {
    throw firstError;
  }

  if (!productResponse.data) {
    return null;
  }

  const subcategoryEntriesByProductId = groupSubcategoriesByProductId(
    linksResponse.data ?? [],
    subcategoriesResponse.data ?? [],
  );

  return buildPublicDetailView(
    productResponse.data,
    detailByProductIdResponse.data,
    galleryResponse.data ?? [],
    subcategoryEntriesByProductId.get(productId) ?? [],
  );
}

export async function fetchRelatedPublicProductsFromSupabase({
  currentProductId,
  categoryId,
  limit = 3,
} = {}) {
  if (!currentProductId) {
    return [];
  }

  let query = supabase
    .from("products")
    .select("id, nombre, ciudad, region, cover_image_url, category_key, is_featured")
    .eq("status", "active")
    .neq("id", currentProductId)
    .limit(Math.max(limit, 3));

  if (categoryId) {
    query = query.eq("category_key", categoryId);
  }

  query = query.order("is_featured", { ascending: false }).order("nombre", { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).slice(0, limit).map((product) => ({
    id: product.id,
    routeKey: product.id,
    title: product.nombre,
    location: formatLocationLabel(product),
    image: product.cover_image_url || "/images/home/1.jpg",
  }));
}
