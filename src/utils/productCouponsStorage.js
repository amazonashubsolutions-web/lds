import {
  formatCouponDateInputValue,
  formatCouponDateLabel,
  normalizeCouponDiscountTarget,
} from "../data/couponsData";
import { getProductNameById } from "../data/productsData";

function parseCouponValueInput(value) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return null;
  }

  const numericValue = Number(normalizedValue.replace(",", "."));

  if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 100) {
    return null;
  }

  return {
    valueType: "percentage",
    valueAmount: numericValue,
    currencyCode: "COP",
  };
}

function createDraftRuleCondition(
  passengerType = "adult",
  operator = ">",
  value = "1",
) {
  return {
    id: `${passengerType}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    passengerType,
    operator,
    value,
  };
}

function createDraftRuleConditionFromRecord(condition = {}) {
  return createDraftRuleCondition(
    condition.passengerType ?? "adult",
    condition.operator ?? ">",
    String(condition.value ?? "0"),
  );
}

function buildProductCouponRulePayload(formData) {
  if (!Array.isArray(formData.ruleConditions) || formData.ruleConditions.length === 0) {
    return null;
  }

  const normalizedConditions = formData.ruleConditions.map((condition) => {
    const passengerCount = Number(condition.value);

    if (
      !condition.passengerType ||
      !condition.operator ||
      !Number.isFinite(passengerCount) ||
      passengerCount < 0
    ) {
      return null;
    }

    return {
      passengerType: condition.passengerType,
      operator: condition.operator,
      value: passengerCount,
    };
  });

  if (normalizedConditions.some((condition) => !condition)) {
    return null;
  }

  return {
    ruleType: "passenger_conditions",
    ruleLogic: "and",
    ruleConditions: normalizedConditions,
  };
}

export function createProductCouponDraft(product) {
  const today = new Date();

  return {
    id: `draft-${Date.now()}`,
    productId: product.id,
    subjectName: product.title,
    couponName: "",
    description: "",
    discountValue: "",
    createdAt: formatCouponDateLabel(today),
    createdAtValue: formatCouponDateInputValue(today),
    startsAt: formatCouponDateInputValue(today),
    endsAt: "",
    discountTarget: "booking_total",
    ruleConditions: [createDraftRuleCondition("adult", ">", "1")],
    status: "active",
  };
}

export function createProductCouponEditDraft(coupon) {
  const normalizedRuleConditions =
    coupon.ruleType === "passenger_conditions" &&
    Array.isArray(coupon.ruleConditions) &&
    coupon.ruleConditions.length
      ? coupon.ruleConditions.map(createDraftRuleConditionFromRecord)
      : coupon.ruleType === "passenger_count" && coupon.ruleConfig
        ? [createDraftRuleConditionFromRecord(coupon.ruleConfig)]
        : [createDraftRuleCondition("adult", ">", "1")];

  return {
    id: coupon.id,
    productId: coupon.productId,
    subjectName:
      getProductNameById(coupon.productId) ??
      coupon.productSnapshotName ??
      "Producto no disponible",
    couponName: coupon.code ?? "",
    description: coupon.description ?? "",
    discountValue:
      coupon.valueType === "percentage" && Number.isFinite(Number(coupon.valueAmount))
        ? String(coupon.valueAmount)
        : "",
    createdAt: formatCouponDateLabel(coupon.createdAt),
    createdAtValue: formatCouponDateInputValue(coupon.createdAt),
    startsAt: formatCouponDateInputValue(coupon.startsAt),
    endsAt: formatCouponDateInputValue(coupon.endsAt),
    discountTarget: normalizeCouponDiscountTarget(coupon.discountTarget),
    ruleConditions: normalizedRuleConditions,
    status: coupon.status || "active",
  };
}

export function createProductCouponRecord(formData) {
  const parsedValue = parseCouponValueInput(formData.discountValue);
  const parsedRule = buildProductCouponRulePayload(formData);

  if (!parsedValue || !parsedRule) {
    return null;
  }

  return {
    id: formData.id,
    scope: "product",
    productId: formData.productId,
    productSnapshotName: formData.subjectName.trim(),
    code: formData.couponName.trim().toUpperCase(),
    description: formData.description.trim(),
    ...parsedValue,
    discountTarget: normalizeCouponDiscountTarget(formData.discountTarget),
    createdAt: formData.createdAtValue,
    startsAt: formData.startsAt,
    endsAt: formData.endsAt,
    ...parsedRule,
    status: formData.status || "active",
  };
}
