import { supabase } from "../../lib/supabase/client.js";
import { normalizeProductId } from "../../utils/productIds.js";

const PRODUCT_DISABLE_CASE_STATUS = "pending_lds_review";
const PRODUCT_DISABLE_REASONS = {
  stop_selling: "Voy a dejar de vender este producto",
  legal_permits: "Falta de permisos o tramites legales de operacion",
  company_closure: "La empresa no va a continuar operaciones",
  weather: "Inhabilitacion por temas climaticos",
  other: "Otros",
};
const AFFECTED_RESERVATION_STATUSES = ["reserved", "issued"];
const LDS_DISABLE_CASES_EMAIL =
  import.meta.env.VITE_LDS_DISABLE_CASES_EMAIL || "soporte@ldstravel.com";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildSlug(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeMeridiemToken(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "");
}

function parseTimeToDatabaseValue(value, fallbackValue = "08:00:00") {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return fallbackValue;
  }

  const twentyFourHourMatch = normalizedValue.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);

  if (twentyFourHourMatch) {
    return `${twentyFourHourMatch[1].padStart(2, "0")}:${twentyFourHourMatch[2]}:00`;
  }

  const meridiemMatch = normalizedValue.match(
    /^([1-9]|1[0-2]):([0-5]\d)\s*([ap]\s*\.?\s*m\.?)$/i,
  );

  if (!meridiemMatch) {
    return fallbackValue;
  }

  const hours12 = Number(meridiemMatch[1]);
  const minutes = meridiemMatch[2];
  const meridiemToken = normalizeMeridiemToken(meridiemMatch[3]);
  const isPm = meridiemToken.startsWith("pm");
  const hours24 = (hours12 % 12) + (isPm ? 12 : 0);

  return `${String(hours24).padStart(2, "0")}:${minutes}:00`;
}

function getMetaValue(metaEntries = [], label) {
  return (
    metaEntries.find((item) => normalizeText(item?.label) === label)?.value ?? ""
  );
}

function buildGalleryPayload(productId, galleryImages, userId) {
  return galleryImages
    .filter((image) => normalizeText(image?.url))
    .sort((left, right) => Number(left.position ?? 0) - Number(right.position ?? 0))
    .map((image, index) => ({
      product_id: productId,
      image_url: normalizeText(image.url),
      file_name: normalizeText(image.fileName),
      position: Number.isFinite(Number(image.position)) ? Number(image.position) : index,
      is_primary: index === 0,
      created_by_user_id: userId,
    }));
}

async function getAuthenticatedActorContext() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user?.id) {
    throw new Error("No hay una sesion activa para gestionar productos.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, agency_id, role, first_name, last_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    throw new Error("No encontramos el perfil del usuario autenticado en public.users.");
  }

  if (profile.agency_id) {
    return {
      userId: user.id,
      providerAgencyId: profile.agency_id,
      profile,
    };
  }

  if (profile.role !== "super_user") {
    throw new Error(
      "El usuario autenticado no tiene una agencia proveedora asociada para crear productos.",
    );
  }

  const { data: providerAgency, error: providerAgencyError } = await supabase
    .from("agencies")
    .select("id")
    .eq("agency_type", "provider")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (providerAgencyError) {
    throw providerAgencyError;
  }

  if (!providerAgency?.id) {
    throw new Error(
      "No encontramos una agencia proveedora activa para asociar el producto nuevo.",
    );
  }

  return {
    userId: user.id,
    providerAgencyId: providerAgency.id,
    profile,
  };
}

function createActorDisplayName(profile) {
  const fullName = [
    normalizeText(profile?.first_name),
    normalizeText(profile?.last_name),
  ]
    .filter(Boolean)
    .join(" ");

  return fullName || normalizeText(profile?.email) || "Usuario LDS";
}

function buildDisableCaseMailto({
  productName,
  reasonLabel,
  reasonOther,
  providerAgencyName,
  requestedByName,
  createdAt,
  recipientEmails,
}) {
  const normalizedRecipients = [...new Set(recipientEmails.filter(Boolean))];

  if (normalizedRecipients.length === 0) {
    return "";
  }

  const subject = encodeURIComponent(
    `Caso de inhabilitacion de producto - ${productName}`,
  );
  const body = encodeURIComponent(
    [
      "Hola,",
      "",
      "LDS registro un nuevo caso de inhabilitacion de producto.",
      `Fecha: ${createdAt}.`,
      `Producto: ${productName}.`,
      `Motivo: ${reasonLabel}.`,
      reasonOther ? `Detalle adicional: ${reasonOther}.` : null,
      `Agencia de viajes: ${providerAgencyName}.`,
      `Usuario administrador solicitante: ${requestedByName}.`,
      "",
      "El producto ya fue bloqueado para nuevas ventas y el caso queda pendiente de revision por LDS.",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return `mailto:${normalizedRecipients.join(",")}?subject=${subject}&body=${body}`;
}

export async function fetchProductDisableImpactFromSupabase(productId) {
  const normalizedProductId = normalizeProductId(productId);

  if (!normalizedProductId) {
    return {
      affectedReservationsCount: 0,
    };
  }

  const { count, error } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("product_id", normalizedProductId)
    .eq("reservation_type", "full")
    .gte("travel_date", getTodayKey())
    .in("status", AFFECTED_RESERVATION_STATUSES);

  if (error) {
    throw error;
  }

  return {
    affectedReservationsCount: Number(count ?? 0),
  };
}

export async function createProductDisableCaseInSupabase({
  productId,
  reasonKey,
  reasonOther = "",
}) {
  const normalizedProductId = normalizeProductId(productId);
  const normalizedReasonKey = normalizeText(reasonKey);
  const normalizedReasonOther = normalizeText(reasonOther);
  const reasonLabel = PRODUCT_DISABLE_REASONS[normalizedReasonKey] || "";

  if (!normalizedProductId || !reasonLabel) {
    throw new Error("Selecciona un motivo valido para crear el caso de inhabilitacion.");
  }

  if (normalizedReasonKey === "other" && !normalizedReasonOther) {
    throw new Error("Describe el motivo cuando eliges la opcion Otros.");
  }

  const actorContext = await getAuthenticatedActorContext();
  const [{ data: product, error: productError }, impact] = await Promise.all([
    supabase
      .from("products")
      .select("id, nombre, provider_agency_id")
      .eq("id", normalizedProductId)
      .maybeSingle(),
    fetchProductDisableImpactFromSupabase(normalizedProductId),
  ]);

  if (productError) {
    throw productError;
  }

  if (!product) {
    throw new Error("No encontramos el producto para crear el caso de inhabilitacion.");
  }

  const [{ data: providerAgency, error: providerAgencyError }, { data: legalRep, error: legalRepError }] =
    await Promise.all([
      supabase
        .from("agencies")
        .select("id, nombre")
        .eq("id", product.provider_agency_id)
        .maybeSingle(),
      supabase
        .from("agency_legal_representatives")
        .select("email, nombre")
        .eq("agency_id", product.provider_agency_id)
        .maybeSingle(),
    ]);

  if (providerAgencyError) {
    throw providerAgencyError;
  }

  if (legalRepError) {
    throw legalRepError;
  }

  const recipientEmails = [
    normalizeText(LDS_DISABLE_CASES_EMAIL),
    normalizeText(legalRep?.email),
  ].filter(Boolean);
  const createdAt = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

  const { data: createdCase, error: caseError } = await supabase
    .from("product_disable_cases")
    .insert({
      product_id: normalizedProductId,
      provider_agency_id: product.provider_agency_id,
      requested_by_user_id: actorContext.userId,
      reason_key: normalizedReasonKey,
      reason_label: reasonLabel,
      reason_other: normalizedReasonKey === "other" ? normalizedReasonOther : null,
      affected_reservations_count: Number(impact.affectedReservationsCount ?? 0),
      case_status: PRODUCT_DISABLE_CASE_STATUS,
      lds_notification_email: normalizeText(LDS_DISABLE_CASES_EMAIL) || null,
      legal_representative_email: normalizeText(legalRep?.email) || null,
      notification_recipients: recipientEmails,
    })
    .select("id")
    .single();

  if (caseError) {
    throw caseError;
  }

  await updateProductStatusInSupabase(normalizedProductId, "inactive");

  return {
    id: createdCase.id,
    affectedReservationsCount: Number(impact.affectedReservationsCount ?? 0),
    productName: normalizeText(product.nombre),
    providerAgencyName:
      normalizeText(providerAgency?.nombre) || "Agencia proveedora",
    requestedByName: createActorDisplayName(actorContext.profile),
    reasonLabel,
    reasonOther: normalizedReasonOther,
    createdAt,
    recipientEmails,
    mailtoUrl: buildDisableCaseMailto({
      productName: normalizeText(product.nombre),
      reasonLabel,
      reasonOther: normalizedReasonOther,
      providerAgencyName:
        normalizeText(providerAgency?.nombre) || "Agencia proveedora",
      requestedByName: createActorDisplayName(actorContext.profile),
      createdAt,
      recipientEmails,
    }),
  };
}

async function syncProductSubcategoryLinks(productId, subcategoryKeys = []) {
  const uniqueKeys = [...new Set(subcategoryKeys.map(normalizeText).filter(Boolean))];

  const { error: deleteError } = await supabase
    .from("product_subcategory_links")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    throw deleteError;
  }

  if (uniqueKeys.length === 0) {
    return [];
  }

  const { data: subcategories, error: subcategoriesError } = await supabase
    .from("product_subcategories")
    .select("id, subcategory_key")
    .in("subcategory_key", uniqueKeys);

  if (subcategoriesError) {
    throw subcategoriesError;
  }

  const subcategoryIdByKey = new Map(
    (subcategories ?? []).map((subcategory) => [
      subcategory.subcategory_key,
      subcategory.id,
    ]),
  );
  const linkPayload = uniqueKeys.map((subcategoryKey) => {
    const productSubcategoryId = subcategoryIdByKey.get(subcategoryKey);

    if (!productSubcategoryId) {
      throw new Error(
        `No encontramos la subcategoria ${subcategoryKey} en Supabase.`,
      );
    }

    return {
      product_id: productId,
      product_subcategory_id: productSubcategoryId,
    };
  });

  const { error: insertError } = await supabase
    .from("product_subcategory_links")
    .insert(linkPayload);

  if (insertError) {
    throw insertError;
  }

  return linkPayload;
}

async function syncProductDetailContent({
  productId,
  detail,
  slugFallback,
  userId,
}) {
  const payload = {
    product_id: productId,
    slug: normalizeText(detail.slug) || slugFallback,
    eyebrow: normalizeText(detail.eyebrow),
    summary: normalizeText(detail.summary),
    meta: Array.isArray(detail.meta) ? detail.meta : [],
    overview: Array.isArray(detail.overview) ? detail.overview : [],
    itinerary: Array.isArray(detail.itinerary) ? detail.itinerary : [],
    includes: Array.isArray(detail.includes) ? detail.includes : [],
    excludes: Array.isArray(detail.excludes) ? detail.excludes : [],
    recommendations: Array.isArray(detail.recommendations) ? detail.recommendations : [],
    considerations: Array.isArray(detail.considerations) ? detail.considerations : [],
    cancellation_policies: Array.isArray(detail.cancellationPolicies)
      ? detail.cancellationPolicies
      : [],
    booking_config:
      detail.booking && typeof detail.booking === "object" ? detail.booking : {},
    updated_by_user_id: userId,
  };

  const { error } = await supabase
    .from("product_detail_content")
    .upsert(payload, { onConflict: "product_id" });

  if (error) {
    throw error;
  }

  return payload;
}

async function syncProductGallery({ productId, galleryImages, userId }) {
  const galleryPayload = buildGalleryPayload(productId, galleryImages, userId);

  if (galleryPayload.length === 0) {
    const { error: deleteError } = await supabase
      .from("product_gallery_images")
      .delete()
      .eq("product_id", productId);

    if (deleteError) {
      throw deleteError;
    }

    return [];
  }

  const { error: upsertError } = await supabase
    .from("product_gallery_images")
    .upsert(galleryPayload, { onConflict: "product_id,position" });

  if (upsertError) {
    throw upsertError;
  }

  const positions = galleryPayload.map((image) => image.position);
  const deleteQuery = supabase
    .from("product_gallery_images")
    .delete()
    .eq("product_id", productId);

  const { error: cleanupError } =
    positions.length > 0
      ? await deleteQuery.not("position", "in", `(${positions.join(",")})`)
      : await deleteQuery;

  if (cleanupError) {
    throw cleanupError;
  }

  return galleryPayload;
}

export async function createProductInSupabase({ createdRecord, draft }) {
  const actorContext = await getAuthenticatedActorContext();
  const productMeta = createdRecord.detail?.meta ?? [];
  const departurePoint =
    normalizeText(draft?.departurePoint) ||
    normalizeText(getMetaValue(productMeta, "Punto de encuentro"));
  const departureTime =
    normalizeText(draft?.departureTime) ||
    normalizeText(getMetaValue(productMeta, "Hora de salida"));
  const returnTime =
    normalizeText(draft?.returnTime) ||
    normalizeText(getMetaValue(productMeta, "Hora de regreso"));
  const slugFallback =
    normalizeText(createdRecord.detail?.slug) ||
    buildSlug(createdRecord.product?.name) ||
    crypto.randomUUID();
  const coverImageUrl =
    createdRecord.detail?.galleryImageUrls?.find(Boolean) ||
    normalizeText(createdRecord.product?.coverImageUrl);
  const productPayload = {
    provider_agency_id: actorContext.providerAgencyId,
    nombre: normalizeText(createdRecord.product?.name),
    ciudad: normalizeText(createdRecord.product?.city),
    region: normalizeText(createdRecord.product?.region),
    punto_encuentro: departurePoint || null,
    descripcion_breve:
      normalizeText(createdRecord.detail?.summary) ||
      normalizeText(createdRecord.product?.name),
    hora_salida: parseTimeToDatabaseValue(departureTime, "08:00:00"),
    hora_llegada: parseTimeToDatabaseValue(returnTime, "17:00:00"),
    status: createdRecord.product?.status === "active" ? "active" : "inactive",
    created_by: actorContext.userId,
    updated_by: actorContext.userId,
    category_key: normalizeText(createdRecord.product?.categoryId),
    pricing_label: normalizeText(createdRecord.product?.pricingLabel) || "Desde",
    pricing_unit_label:
      normalizeText(createdRecord.product?.pricingUnitLabel) || "persona",
    cover_image_url: coverImageUrl || null,
    is_featured: Boolean(createdRecord.product?.isFeatured),
  };

  const { data: insertedProduct, error: insertError } = await supabase
    .from("products")
    .insert(productPayload)
    .select(
      "id, nombre, ciudad, region, status, category_key, pricing_label, pricing_unit_label, cover_image_url, is_featured",
    )
    .single();

  if (insertError) {
    throw insertError;
  }

  const productId = normalizeProductId(insertedProduct.id);

  await syncProductSubcategoryLinks(productId, createdRecord.subcategoryIds);
  await syncProductDetailContent({
    productId,
    detail: createdRecord.detail,
    slugFallback,
    userId: actorContext.userId,
  });
  await syncProductGallery({
    productId,
    galleryImages:
      createdRecord.detail?.galleryImageUrls?.map((imageUrl, index) => ({
        url: imageUrl,
        fileName: imageUrl.split("/").pop() ?? "",
        position: index,
      })) ?? [],
    userId: actorContext.userId,
  });

  return {
    productId,
    product: insertedProduct,
  };
}

export async function updateProductEditorialContentInSupabase({
  detail,
  contentDraft,
  galleryImages,
}) {
  const actorContext = await getAuthenticatedActorContext();
  const productId = normalizeProductId(detail.id);
  const normalizedGalleryImages = galleryImages.filter((image) =>
    normalizeText(image?.url),
  );
  const primaryImageUrl = normalizedGalleryImages[0]?.url || null;

  const { error: updateProductError } = await supabase
    .from("products")
    .update({
      nombre: normalizeText(contentDraft?.title) || normalizeText(detail.title),
      descripcion_breve:
        normalizeText(contentDraft?.summary) || normalizeText(detail.summary),
      cover_image_url: primaryImageUrl,
      updated_by: actorContext.userId,
    })
    .eq("id", productId);

  if (updateProductError) {
    throw updateProductError;
  }

  await syncProductDetailContent({
    productId,
    detail: {
      ...detail,
      ...contentDraft,
      summary: normalizeText(contentDraft?.summary),
      booking: contentDraft?.booking ?? detail.booking,
      slug: detail.slug,
      eyebrow: detail.eyebrow,
    },
    slugFallback: normalizeText(detail.slug) || buildSlug(contentDraft?.title),
    userId: actorContext.userId,
  });

  await syncProductGallery({
    productId,
    galleryImages: normalizedGalleryImages,
    userId: actorContext.userId,
  });

  return {
    productId,
    primaryImageUrl,
  };
}

export async function updateProductStatusInSupabase(productId, nextStatus) {
  const actorContext = await getAuthenticatedActorContext();
  const normalizedStatus = nextStatus === "active" ? "active" : "inactive";

  const { error } = await supabase
    .from("products")
    .update({
      status: normalizedStatus,
      updated_by: actorContext.userId,
    })
    .eq("id", normalizeProductId(productId));

  if (error) {
    throw error;
  }

  return normalizedStatus;
}
