import { supabase } from "../../lib/supabase/client.js";
import { getProductNameById } from "../../data/productsData.js";
import { isSameProductId, normalizeProductId } from "../../utils/productIds.js";

const LEGACY_PRODUCT_COUPONS_STORAGE_KEY = "lds-panel-control-product-coupons";
const LEGACY_PRODUCT_COUPONS_MIGRATION_KEY =
  "lds-panel-control-product-coupons-migrated-to-supabase-v1";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value ?? "").trim(),
  );
}

function normalizeCouponRecord(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    scope: "product",
    productId: normalizeProductId(row.product_id),
    productSnapshotName: row.products?.nombre ?? "",
    code: row.code,
    description: row.description ?? "",
    valueType: row.value_type,
    valueAmount: Number(row.value_amount ?? 0),
    currencyCode: row.currency_code ?? "COP",
    discountTarget: row.discount_target ?? "booking_total",
    createdAt: row.created_at ? row.created_at.slice(0, 10) : "",
    startsAt: row.starts_at ?? "",
    endsAt: row.ends_at ?? "",
    ruleType: row.rule_type ?? "passenger_conditions",
    ruleLogic: row.rule_logic ?? "and",
    ruleConditions: Array.isArray(row.rule_conditions) ? row.rule_conditions : [],
    status: row.status ?? "active",
  };
}

function buildCouponPayload(record, actorUserId) {
  return {
    ...(isUuid(record.id) ? { id: record.id } : {}),
    product_id: normalizeProductId(record.productId),
    code: normalizeText(record.code).toUpperCase(),
    description: normalizeText(record.description),
    value_type: record.valueType ?? "percentage",
    value_amount: Number(record.valueAmount ?? 0),
    currency_code: normalizeText(record.currencyCode) || "COP",
    discount_target: normalizeText(record.discountTarget) || "booking_total",
    starts_at: normalizeText(record.startsAt),
    ends_at: normalizeText(record.endsAt),
    rule_type: normalizeText(record.ruleType) || "passenger_conditions",
    rule_logic: normalizeText(record.ruleLogic) || "and",
    rule_conditions: Array.isArray(record.ruleConditions) ? record.ruleConditions : [],
    status: record.status === "inactive" ? "inactive" : "active",
    created_by_user_id: actorUserId,
    updated_by_user_id: actorUserId,
  };
}

function canUseStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function readLegacyStoredProductCoupons() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(LEGACY_PRODUCT_COUPONS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (coupon) =>
        coupon &&
        coupon.scope === "product" &&
        typeof coupon.code === "string" &&
        normalizeText(coupon.code),
    );
  } catch {
    return [];
  }
}

function shouldAttemptLegacyImport() {
  if (!canUseStorage()) {
    return false;
  }

  if (window.localStorage.getItem(LEGACY_PRODUCT_COUPONS_MIGRATION_KEY)) {
    return false;
  }

  return readLegacyStoredProductCoupons().length > 0;
}

function markLegacyImportCompleted(summary) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    LEGACY_PRODUCT_COUPONS_MIGRATION_KEY,
    JSON.stringify({
      importedAt: new Date().toISOString(),
      ...summary,
    }),
  );
}

function getLegacyCouponProductName(coupon) {
  return (
    normalizeText(coupon.productSnapshotName) ||
    normalizeText(getProductNameById(coupon.productId)) ||
    ""
  );
}

function resolveLegacyCouponProductId(coupon, productsById, productsByName) {
  const normalizedLegacyProductId = normalizeProductId(coupon.productId);

  if (isUuid(normalizedLegacyProductId) && productsById.has(normalizedLegacyProductId)) {
    return normalizedLegacyProductId;
  }

  const legacyProductName = getLegacyCouponProductName(coupon).toLowerCase();

  if (!legacyProductName) {
    return "";
  }

  return productsByName.get(legacyProductName) ?? "";
}

async function getAuthenticatedUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user?.id) {
    throw new Error("No hay una sesion activa para gestionar cupones.");
  }

  return user.id;
}

function getFirstError(responses) {
  return responses.map((response) => response.error).find(Boolean) ?? null;
}

export async function fetchProductCouponRecordsFromSupabase({
  productId,
  publicOnly = false,
} = {}) {
  const query = supabase
    .from("product_coupons")
    .select(
      "id, product_id, code, description, value_type, value_amount, currency_code, discount_target, starts_at, ends_at, rule_type, rule_logic, rule_conditions, status, created_at, products(nombre)",
    )
    .order("created_at", { ascending: false });

  if (productId) {
    query.eq("product_id", normalizeProductId(productId));
  }

  if (publicOnly) {
    query.eq("status", "active");
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map(normalizeCouponRecord).filter(Boolean);
}

export async function fetchProductCouponItemsFromSupabase(options = {}) {
  return fetchProductCouponRecordsFromSupabase(options);
}

export async function upsertProductCouponInSupabase(record) {
  const actorUserId = await getAuthenticatedUserId();
  const payload = buildCouponPayload(record, actorUserId);
  const { data, error } = await supabase
    .from("product_coupons")
    .upsert(payload)
    .select(
      "id, product_id, code, description, value_type, value_amount, currency_code, discount_target, starts_at, ends_at, rule_type, rule_logic, rule_conditions, status, created_at, products(nombre)",
    )
    .single();

  if (error) {
    throw error;
  }

  return normalizeCouponRecord(data);
}

export async function updateProductCouponStatusInSupabase(couponId, nextStatus) {
  const actorUserId = await getAuthenticatedUserId();
  const normalizedStatus = nextStatus === "inactive" ? "inactive" : "active";
  const { data, error } = await supabase
    .from("product_coupons")
    .update({
      status: normalizedStatus,
      updated_by_user_id: actorUserId,
    })
    .eq("id", couponId)
    .select(
      "id, product_id, code, description, value_type, value_amount, currency_code, discount_target, starts_at, ends_at, rule_type, rule_logic, rule_conditions, status, created_at, products(nombre)",
    )
    .single();

  if (error) {
    throw error;
  }

  return normalizeCouponRecord(data);
}

export async function importLegacyProductCouponsFromLocalStorage() {
  if (!shouldAttemptLegacyImport()) {
    return {
      importedCount: 0,
      skippedCount: 0,
      attempted: false,
    };
  }

  const legacyCoupons = readLegacyStoredProductCoupons();

  if (!legacyCoupons.length) {
    markLegacyImportCompleted({
      attempted: true,
      importedCount: 0,
      skippedCount: 0,
    });

    return {
      importedCount: 0,
      skippedCount: 0,
      attempted: true,
    };
  }

  const actorUserId = await getAuthenticatedUserId();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, nombre");

  if (error) {
    throw error;
  }

  const productsById = new Map(
    (products ?? []).map((product) => [normalizeProductId(product.id), product]),
  );
  const productsByName = new Map(
    (products ?? []).map((product) => [
      normalizeText(product.nombre).toLowerCase(),
      normalizeProductId(product.id),
    ]),
  );

  const importableCoupons = [];
  let skippedCount = 0;

  for (const legacyCoupon of legacyCoupons) {
    const resolvedProductId = resolveLegacyCouponProductId(
      legacyCoupon,
      productsById,
      productsByName,
    );

    if (!resolvedProductId) {
      skippedCount += 1;
      continue;
    }

    importableCoupons.push({
      ...buildCouponPayload(
        {
          ...legacyCoupon,
          productId: resolvedProductId,
        },
        actorUserId,
      ),
      created_at: normalizeText(legacyCoupon.createdAt)
        ? `${normalizeText(legacyCoupon.createdAt)}T00:00:00`
        : undefined,
    });
  }

  if (importableCoupons.length > 0) {
    const { error: upsertError } = await supabase
      .from("product_coupons")
      .upsert(importableCoupons, { onConflict: "code" });

    if (upsertError) {
      throw upsertError;
    }
  }

  markLegacyImportCompleted({
    attempted: true,
    importedCount: importableCoupons.length,
    skippedCount,
  });

  return {
    importedCount: importableCoupons.length,
    skippedCount,
    attempted: true,
  };
}

export function findCouponByCode(coupons, code, productId) {
  const normalizedCode = normalizeText(code).toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  return (
    (coupons ?? []).find(
      (coupon) =>
        coupon.scope === "product" &&
        coupon.code === normalizedCode &&
        (!productId || isSameProductId(coupon.productId, productId)),
    ) ?? null
  );
}
