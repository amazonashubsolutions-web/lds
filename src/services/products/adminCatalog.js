import { supabase } from "../../lib/supabase/client.js";
import { normalizeProductId } from "../../utils/productIds.js";

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

function normalizeUiStatus(status) {
  return status === "active" ? "active" : "inactive";
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

function buildPanelItem(product, detailRow, galleryRows, subcategoryLabelsByProductId) {
  const productId = normalizeProductId(product.id);
  const subcategoryEntries = subcategoryLabelsByProductId.get(productId) ?? [];
  const subcategoryIds = subcategoryEntries.map((subcategory) => subcategory.id);
  const bookingConfig = detailRow?.booking_config ?? {};
  const departureDetails = buildDepartureDetails(product, detailRow, subcategoryIds);

  return {
    id: productId,
    title: product.nombre,
    location: formatLocationLabel(product),
    price: parsePriceValue(bookingConfig.price),
    status: normalizeUiStatus(product.status),
    featured: Boolean(product.is_featured),
    image: pickPrimaryImage(galleryRows, product.cover_image_url ?? ""),
    badgeLabel: product.is_featured ? "Destacado" : undefined,
    priceLabel: product.pricing_label,
    priceSuffix: product.pricing_unit_label
      ? `/ ${product.pricing_unit_label}`
      : "",
    categoryId: product.category_key,
    categoryLabel:
      CATEGORY_LABELS[product.category_key] ?? product.category_key ?? "Sin categoria",
    subcategoryIds,
    subcategoryLabels: subcategoryEntries.map((subcategory) => subcategory.label),
    ...departureDetails,
  };
}

function buildDetailView(product, detailRow, galleryRows, subcategoryEntries = []) {
  const productId = normalizeProductId(product.id);
  const normalizedGalleryEntries = normalizeGalleryEntries(productId, galleryRows);
  const resolvedContent = createFallbackDetailContent(productId, product, detailRow);
  const metaEntries = normalizeMetaEntries(detailRow?.meta);
  return {
    id: productId,
    detailId: productId,
    productId,
    slug: detailRow?.slug ?? productId,
    categoryId: product.category_key,
    title: resolvedContent.title || product.nombre,
    location: formatLocationLabel(product),
    featured: Boolean(product.is_featured),
    status: normalizeUiStatus(product.status),
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
  };
}

function groupGalleryRowsByProductId(galleryRows) {
  const galleryByProductId = new Map();

  for (const galleryRow of galleryRows ?? []) {
    const productId = normalizeProductId(galleryRow.product_id);
    const rows = galleryByProductId.get(productId) ?? [];
    rows.push(galleryRow);
    galleryByProductId.set(productId, rows);
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
    const productId = normalizeProductId(link.product_id);
    const matchedSubcategory = subcategoryById.get(link.product_subcategory_id);

    if (!productId || !matchedSubcategory) {
      continue;
    }

    const currentEntries = subcategoriesByProductId.get(productId) ?? [];
    currentEntries.push(matchedSubcategory);
    subcategoriesByProductId.set(productId, currentEntries);
  }

  return subcategoriesByProductId;
}

async function hasAdminSupabaseSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return Boolean(data.session?.access_token);
}

function getFirstResponseError(responses) {
  return responses.map((response) => response.error).find(Boolean) ?? null;
}

async function getAuthenticatedProductViewerProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user?.id) {
    throw new Error("No hay una sesion activa para consultar productos.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select(`
      id,
      agency_id,
      role,
      agency:agencies (
        id,
        agency_type
      )
    `)
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    throw new Error("No encontramos el perfil del usuario autenticado.");
  }

  return profile;
}

function scopeProductsQueryByViewer(query, profile) {
  if (!profile) {
    return query;
  }

  if (profile.role === "super_user") {
    return query;
  }

  if (profile.role === "agency_admin" && profile.agency_id) {
    return query.eq("provider_agency_id", profile.agency_id);
  }

  if (
    profile.role === "travel_agent" &&
    profile.agency_id &&
    profile.agency?.agency_type === "provider"
  ) {
    return query.eq("provider_agency_id", profile.agency_id);
  }

  return query.eq("id", "__no_visible_products__");
}

export async function fetchAdminPanelProductItemsFromSupabase() {
  if (!(await hasAdminSupabaseSession())) {
    return null;
  }

  const viewerProfile = await getAuthenticatedProductViewerProfile();

  let productsQuery = supabase
    .from("products")
    .select(
      "id, provider_agency_id, nombre, ciudad, region, punto_encuentro, descripcion_breve, hora_salida, status, category_key, pricing_label, pricing_unit_label, cover_image_url, is_featured",
    )
    .order("nombre", { ascending: true });

  productsQuery = scopeProductsQueryByViewer(productsQuery, viewerProfile);

  const [productsResponse, detailResponse, galleryResponse, subcategoriesResponse, linksResponse] =
    await Promise.all([
      productsQuery,
      supabase
        .from("product_detail_content")
        .select("product_id, slug, eyebrow, summary, meta, booking_config"),
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

  const responseError = getFirstResponseError([
    productsResponse,
    detailResponse,
    galleryResponse,
    subcategoriesResponse,
    linksResponse,
  ]);

  if (responseError) {
    throw responseError;
  }

  const detailByProductId = new Map(
    (detailResponse.data ?? []).map((detailRow) => [
      normalizeProductId(detailRow.product_id),
      detailRow,
    ]),
  );
  const galleryByProductId = groupGalleryRowsByProductId(galleryResponse.data);
  const subcategoryLabelsByProductId = groupSubcategoriesByProductId(
    linksResponse.data,
    subcategoriesResponse.data,
  );

  return (productsResponse.data ?? []).map((product) =>
    buildPanelItem(
      product,
      detailByProductId.get(normalizeProductId(product.id)),
      galleryByProductId.get(normalizeProductId(product.id)) ?? [],
      subcategoryLabelsByProductId,
    ),
  );
}

export async function fetchAdminProductDetailFromSupabase(productId) {
  if (!(await hasAdminSupabaseSession())) {
    return null;
  }

  const viewerProfile = await getAuthenticatedProductViewerProfile();

  const normalizedProductId = normalizeProductId(productId);

  if (!normalizedProductId) {
    return null;
  }

  let productQuery = supabase
    .from("products")
    .select(
      "id, provider_agency_id, nombre, ciudad, region, punto_encuentro, descripcion_breve, hora_salida, status, category_key, pricing_label, pricing_unit_label, cover_image_url, is_featured",
    )
    .eq("id", normalizedProductId);

  productQuery = scopeProductsQueryByViewer(productQuery, viewerProfile);

  const [productResponse, detailResponse, galleryResponse, subcategoriesResponse, linksResponse] =
    await Promise.all([
      productQuery.maybeSingle(),
      supabase
        .from("product_detail_content")
        .select(
          "product_id, slug, eyebrow, summary, meta, overview, itinerary, includes, excludes, recommendations, considerations, cancellation_policies, booking_config",
        )
        .eq("product_id", normalizedProductId)
        .maybeSingle(),
      supabase
        .from("product_gallery_images")
        .select("id, product_id, image_url, file_name, position, is_primary")
        .eq("product_id", normalizedProductId)
        .order("position", { ascending: true }),
      supabase
        .from("product_subcategories")
        .select("id, subcategory_key, nombre"),
      supabase
        .from("product_subcategory_links")
        .select("product_id, product_subcategory_id")
        .eq("product_id", normalizedProductId),
    ]);

  const responseError = getFirstResponseError([
    productResponse,
    detailResponse,
    galleryResponse,
    subcategoriesResponse,
    linksResponse,
  ]);

  if (responseError) {
    throw responseError;
  }

  if (!productResponse.data) {
    return null;
  }

  const subcategoryLabelsByProductId = groupSubcategoriesByProductId(
    linksResponse.data,
    subcategoriesResponse.data,
  );

  return {
    detail: buildDetailView(
      productResponse.data,
      detailResponse.data,
      galleryResponse.data ?? [],
      subcategoryLabelsByProductId.get(normalizedProductId) ?? [],
    ),
    panelProduct: buildPanelItem(
      productResponse.data,
      detailResponse.data,
      galleryResponse.data ?? [],
      subcategoryLabelsByProductId,
    ),
  };
}
