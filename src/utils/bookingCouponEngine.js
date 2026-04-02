import {
  formatCouponValueLabel,
  formatProductCouponRuleLabel,
  getCouponDiscountTargetLabel,
  normalizeCouponDiscountTarget,
} from "../data/couponsData";
import { getAllProductCouponRecords } from "./productCouponsStorage";

const PASSENGER_COUNT_KEYS = {
  adult: ["adult", "adults"],
  child: ["child", "children"],
  baby: ["baby", "babies"],
};

function toNumericValue(value) {
  const normalizedValue = Number(value);

  if (!Number.isFinite(normalizedValue)) {
    return 0;
  }

  return normalizedValue;
}

function getPassengerCountByType(passengerCounts, passengerType) {
  const keys = PASSENGER_COUNT_KEYS[passengerType] ?? [passengerType];

  return keys.reduce((matchedValue, key) => {
    if (matchedValue !== null) {
      return matchedValue;
    }

    return Object.prototype.hasOwnProperty.call(passengerCounts, key)
      ? toNumericValue(passengerCounts[key])
      : null;
  }, null);
}

function isIsoDateInRange(value, start, end) {
  if (!value) {
    return false;
  }

  if (start && value < start) {
    return false;
  }

  if (end && value > end) {
    return false;
  }

  return true;
}

function matchesCouponTravelDate(coupon, travelDate) {
  const needsTravelDate = Boolean(coupon?.startsAt || coupon?.endsAt);

  if (!needsTravelDate) {
    return true;
  }

  if (!travelDate) {
    return false;
  }

  return isIsoDateInRange(travelDate, coupon.startsAt, coupon.endsAt);
}

export function normalizeBookingPassengerCounts(passengerCounts = {}) {
  return {
    adult: getPassengerCountByType(passengerCounts, "adult") ?? 0,
    child: getPassengerCountByType(passengerCounts, "child") ?? 0,
    baby: getPassengerCountByType(passengerCounts, "baby") ?? 0,
  };
}

function normalizeBookingPassengerSubtotals(passengerSubtotals = {}) {
  return {
    adults_subtotal:
      getPassengerCountByType(passengerSubtotals, "adult") ?? 0,
    children_subtotal:
      getPassengerCountByType(passengerSubtotals, "child") ?? 0,
    babies_subtotal:
      getPassengerCountByType(passengerSubtotals, "baby") ?? 0,
  };
}

export function matchesPassengerCondition(condition, passengerCounts = {}) {
  if (!condition?.passengerType || !condition?.operator) {
    return false;
  }

  const normalizedPassengerCounts =
    normalizeBookingPassengerCounts(passengerCounts);
  const passengerCount =
    normalizedPassengerCounts[condition.passengerType] ?? 0;
  const expectedValue = toNumericValue(condition.value);

  if (condition.operator === ">") {
    return passengerCount > expectedValue;
  }

  if (condition.operator === "<") {
    return passengerCount < expectedValue;
  }

  if (condition.operator === "=") {
    return passengerCount === expectedValue;
  }

  return false;
}

export function matchesCouponPassengerRules(coupon, passengerCounts = {}) {
  if (!coupon) {
    return false;
  }

  if (
    coupon.ruleType === "passenger_conditions" &&
    Array.isArray(coupon.ruleConditions)
  ) {
    return coupon.ruleConditions.every((condition) =>
      matchesPassengerCondition(condition, passengerCounts),
    );
  }

  if (coupon.ruleType === "passenger_count" && coupon.ruleConfig) {
    return matchesPassengerCondition(coupon.ruleConfig, passengerCounts);
  }

  return true;
}

export function getCouponDiscountBaseAmount(
  coupon,
  totalAmount,
  passengerSubtotals = {},
) {
  const normalizedTotalAmount = toNumericValue(totalAmount);
  const normalizedPassengerSubtotals =
    normalizeBookingPassengerSubtotals(passengerSubtotals);
  const discountTarget = normalizeCouponDiscountTarget(coupon?.discountTarget);

  if (discountTarget === "adults_subtotal") {
    return normalizedPassengerSubtotals.adults_subtotal;
  }

  if (discountTarget === "children_subtotal") {
    return normalizedPassengerSubtotals.children_subtotal;
  }

  return normalizedTotalAmount;
}

export function calculateCouponDiscountAmount(
  totalAmount,
  coupon,
  passengerSubtotals = {},
) {
  const discountBaseAmount = getCouponDiscountBaseAmount(
    coupon,
    totalAmount,
    passengerSubtotals,
  );

  if (
    !coupon ||
    coupon.valueType !== "percentage" ||
    discountBaseAmount <= 0
  ) {
    return 0;
  }

  return Math.round(
    discountBaseAmount * (toNumericValue(coupon.valueAmount) / 100),
  );
}

export function evaluateProductCouponForBooking({
  coupon,
  productId,
  passengerCounts,
  passengerSubtotals,
  travelDate,
  totalAmount,
}) {
  if (!coupon) {
    return {
      coupon: null,
      isEligible: false,
      discountAmount: 0,
      totalAfterDiscount: toNumericValue(totalAmount),
      reason: "Cupon no disponible.",
    };
  }

  const normalizedTotalAmount = toNumericValue(totalAmount);
  const matchesProduct =
    !productId || Number(coupon.productId) === Number(productId);
  const isActive = coupon.status === "active";
  const needsTravelDate = Boolean(coupon.startsAt || coupon.endsAt);
  const isTravelDateValid = matchesCouponTravelDate(coupon, travelDate);
  const matchesRules = matchesCouponPassengerRules(coupon, passengerCounts);
  const discountBaseAmount = getCouponDiscountBaseAmount(
    coupon,
    normalizedTotalAmount,
    passengerSubtotals,
  );
  const isEligible =
    matchesProduct && isActive && isTravelDateValid && matchesRules;
  const discountAmount = isEligible
    ? calculateCouponDiscountAmount(
        normalizedTotalAmount,
        coupon,
        passengerSubtotals,
      )
    : 0;

  let reason = "";

  if (!matchesProduct) {
    reason = "El cupon no pertenece a este producto.";
  } else if (!isActive) {
    reason = "El cupon no esta activo.";
  } else if (needsTravelDate && !travelDate) {
    reason = "Selecciona una fecha para validar el cupon.";
  } else if (!isTravelDateValid) {
    reason = "El cupon no aplica para la fecha seleccionada.";
  } else if (!matchesRules) {
    reason =
      formatProductCouponRuleLabel(coupon) ||
      "La reserva no cumple la regla del cupon.";
  }

  return {
    coupon,
    isEligible,
    matchesProduct,
    isActive,
    isTravelDateValid,
    matchesRules,
    normalizedPassengerCounts: normalizeBookingPassengerCounts(passengerCounts),
    discountTarget: normalizeCouponDiscountTarget(coupon.discountTarget),
    discountTargetLabel: getCouponDiscountTargetLabel(coupon.discountTarget),
    discountBaseAmount,
    discountAmount,
    totalAmount: normalizedTotalAmount,
    totalAfterDiscount: Math.max(0, normalizedTotalAmount - discountAmount),
    valueLabel: formatCouponValueLabel(coupon),
    ruleLabel: formatProductCouponRuleLabel(coupon),
    reason,
  };
}

export function getDateAvailableProductCoupons({
  productId,
  travelDate,
  coupons = getAllProductCouponRecords(),
}) {
  return coupons.filter(
    (coupon) =>
      coupon.scope === "product" &&
      coupon.status === "active" &&
      (!productId || Number(coupon.productId) === Number(productId)) &&
      matchesCouponTravelDate(coupon, travelDate),
  );
}

export function getProductCouponEvaluationsForBooking({
  productId,
  passengerCounts,
  passengerSubtotals,
  travelDate,
  totalAmount,
  coupons = getAllProductCouponRecords(),
}) {
  return coupons
    .filter(
      (coupon) =>
        coupon.scope === "product" &&
        (!productId || Number(coupon.productId) === Number(productId)),
    )
    .map((coupon) =>
      evaluateProductCouponForBooking({
        coupon,
        productId,
        passengerCounts,
        passengerSubtotals,
        travelDate,
        totalAmount,
      }),
    );
}

export function getEligibleProductCouponEvaluationsForBooking(input) {
  return getProductCouponEvaluationsForBooking(input).filter(
    (evaluation) => evaluation.isEligible,
  );
}

export function getBestProductCouponEvaluationForBooking(input) {
  return getEligibleProductCouponEvaluationsForBooking(input).reduce(
    (bestEvaluation, currentEvaluation) => {
      if (!bestEvaluation) {
        return currentEvaluation;
      }

      return currentEvaluation.discountAmount > bestEvaluation.discountAmount
        ? currentEvaluation
        : bestEvaluation;
    },
    null,
  );
}

export function findProductCouponByCode(code, productId) {
  const normalizedCode = String(code ?? "").trim().toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  return (
    getAllProductCouponRecords().find(
      (coupon) =>
        coupon.scope === "product" &&
        coupon.code === normalizedCode &&
        (!productId || Number(coupon.productId) === Number(productId)),
    ) ?? null
  );
}
