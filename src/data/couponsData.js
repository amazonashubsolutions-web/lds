import { getProductNameById } from "./productsData";

const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const COUPON_STATUS_LABELS = {
  active: "Activo",
  inactive: "Inactivo",
};

export const COUPON_DISCOUNT_TARGET_LABELS = {
  booking_total: "Total de la reserva",
  adults_subtotal: "Valor de los adultos",
  children_subtotal: "Valor de los ninos",
};

const PASSENGER_TYPE_COPY = {
  adult: {
    singular: "adulto",
    plural: "adultos",
  },
  child: {
    singular: "nino",
    plural: "ninos",
  },
};

export const panelControlCouponCustomers = [
  { id: "USR-001", fullName: "Maria Fernanda Ruiz" },
  { id: "USR-002", fullName: "Carlos Mendoza" },
  { id: "USR-003", fullName: "Laura Pineda" },
];

const customerNameById = new Map(
  panelControlCouponCustomers.map((customer) => [customer.id, customer.fullName]),
);

function normalizeDateValue(value) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== "string" || !value) {
    return new Date(Number.NaN);
  }

  return new Date(`${value}T00:00:00`);
}

function isValidDate(date) {
  return !Number.isNaN(date.getTime());
}

export function formatCouponDateLabel(value) {
  const normalizedDate = normalizeDateValue(value);

  if (!isValidDate(normalizedDate)) {
    return "";
  }

  const month = MONTH_LABELS[normalizedDate.getMonth()];
  const day = String(normalizedDate.getDate()).padStart(2, "0");
  const year = normalizedDate.getFullYear();

  return `${month} ${day}, ${year}`;
}

export function formatCouponDateInputValue(value = new Date()) {
  const normalizedDate = normalizeDateValue(value);

  if (!isValidDate(normalizedDate)) {
    return "";
  }

  const year = normalizedDate.getFullYear();
  const month = String(normalizedDate.getMonth() + 1).padStart(2, "0");
  const day = String(normalizedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getCouponStatusLabel(status) {
  return COUPON_STATUS_LABELS[status] ?? status;
}

export function normalizeCouponDiscountTarget(value) {
  return COUPON_DISCOUNT_TARGET_LABELS[value] ? value : "booking_total";
}

export function getCouponDiscountTargetLabel(value) {
  return (
    COUPON_DISCOUNT_TARGET_LABELS[normalizeCouponDiscountTarget(value)] ??
    COUPON_DISCOUNT_TARGET_LABELS.booking_total
  );
}

function buildProductCouponDescription(coupon) {
  return coupon.description?.trim() ?? "";
}

export function formatCouponValueLabel(coupon) {
  if (coupon.valueType === "percentage") {
    return `${coupon.valueAmount}%`;
  }

  if (coupon.valueType === "fixed_amount") {
    return `$${new Intl.NumberFormat("es-CO").format(coupon.valueAmount)}`;
  }

  return "";
}

function getPassengerTypeWord(passengerType, count) {
  const copy = PASSENGER_TYPE_COPY[passengerType];

  if (!copy) {
    return passengerType;
  }

  return count === 1 ? copy.singular : copy.plural;
}

export function formatPassengerConditionFragment(ruleConfig) {
  if (!ruleConfig) {
    return "";
  }

  const passengerCount = Number(ruleConfig.value);
  const passengerTypeWord = getPassengerTypeWord(
    ruleConfig.passengerType,
    passengerCount,
  );

  if (ruleConfig.operator === "=" && passengerCount === 0) {
    return `no hayan ${getPassengerTypeWord(ruleConfig.passengerType, 2)}`;
  }

  if (ruleConfig.operator === "=") {
    const verb = passengerCount === 1 ? "haya" : "hayan";
    return `${verb} ${passengerCount} ${passengerTypeWord}`;
  }

  if (ruleConfig.operator === ">") {
    return `haya mas de ${passengerCount} ${passengerTypeWord}`;
  }

  if (ruleConfig.operator === "<") {
    return `haya menos de ${passengerCount} ${passengerTypeWord}`;
  }

  return "se cumpla la condicion definida";
}

export function formatPassengerCountRuleSentence(
  ruleConfig,
  prefix = "El cupon se aplicara cuando",
) {
  const fragment = formatPassengerConditionFragment(ruleConfig);

  if (!fragment) {
    return "";
  }

  return `${prefix} ${fragment} en la reserva.`;
}

export function formatPassengerConditionsSentence(
  ruleConditions,
  prefix = "El cupon se aplicara cuando",
) {
  if (!Array.isArray(ruleConditions) || ruleConditions.length === 0) {
    return "";
  }

  const fragments = ruleConditions
    .map(formatPassengerConditionFragment)
    .filter(Boolean);

  if (fragments.length === 0) {
    return "";
  }

  return `${prefix} ${fragments.join(" y ")} en la reserva.`;
}

export function formatProductCouponRuleLabel(coupon) {
  if (coupon.ruleType === "passenger_conditions" && coupon.ruleConditions) {
    return formatPassengerConditionsSentence(coupon.ruleConditions);
  }

  if (coupon.ruleType === "passenger_count" && coupon.ruleConfig) {
    return formatPassengerCountRuleSentence(coupon.ruleConfig);
  }

  return coupon.rule ?? "";
}

function getCouponProductName(coupon) {
  return getProductNameById(coupon.productId) ?? coupon.productSnapshotName ?? "Producto no disponible";
}

function getCouponCustomerName(coupon) {
  return (
    customerNameById.get(coupon.customerId) ??
    coupon.customerSnapshotName ??
    "Cliente no disponible"
  );
}

export const panelControlCoupons = [
  {
    id: "CP-001",
    scope: "product",
    productId: 1,
    code: "CACAO10",
    description: "Descuento promocional para reservas online del tour.",
    valueType: "percentage",
    valueAmount: 10,
    currencyCode: "COP",
    discountTarget: "booking_total",
    createdAt: "2026-03-05",
    startsAt: "2026-04-01",
    endsAt: "2026-04-30",
    ruleType: "passenger_conditions",
    ruleLogic: "and",
    ruleConditions: [
      {
        passengerType: "adult",
        operator: ">",
        value: 2,
      },
    ],
    status: "active",
  },
  {
    id: "CP-002",
    scope: "product",
    productId: 2,
    code: "TERMALES20",
    description: "Bono fijo para impulsar ventas de temporada baja.",
    valueType: "percentage",
    valueAmount: 20,
    currencyCode: "COP",
    discountTarget: "children_subtotal",
    createdAt: "2026-02-20",
    startsAt: "2026-03-10",
    endsAt: "2026-05-10",
    ruleType: "passenger_conditions",
    ruleLogic: "and",
    ruleConditions: [
      {
        passengerType: "child",
        operator: ">",
        value: 1,
      },
    ],
    status: "active",
  },
  {
    id: "CP-003",
    scope: "product",
    productId: 4,
    code: "KAYAK15",
    description: "Promocion para grupos pequenos en fechas seleccionadas.",
    valueType: "percentage",
    valueAmount: 15,
    currencyCode: "COP",
    discountTarget: "booking_total",
    createdAt: "2026-01-18",
    startsAt: "2026-02-01",
    endsAt: "2026-03-15",
    ruleType: "passenger_conditions",
    ruleLogic: "and",
    ruleConditions: [
      {
        passengerType: "adult",
        operator: "=",
        value: 2,
      },
      {
        passengerType: "child",
        operator: "=",
        value: 0,
      },
    ],
    status: "inactive",
  },
  {
    id: "CC-101",
    scope: "client",
    customerId: "USR-001",
    bookingCode: "RES-84391",
    code: "VIPMARIA",
    description: "Credito reutilizable generado tras cancelacion voluntaria del paseo.",
    creationReason:
      "Cancelacion por decision del cliente. Se desconto la multa y el saldo restante se convirtio en cupon.",
    valueType: "fixed_amount",
    valueAmount: 185000,
    currencyCode: "COP",
    createdAt: "2026-03-02",
    expiresAt: "2026-06-30",
    status: "active",
  },
  {
    id: "CC-102",
    scope: "client",
    customerId: "USR-002",
    bookingCode: "RES-85107",
    code: "OPERADORFULL",
    description: "Cupon emitido por cancelacion total del operador.",
    creationReason:
      "El operador cancelo la salida y el valor completo de la reserva paso a saldo reutilizable para el cliente.",
    valueType: "fixed_amount",
    valueAmount: 320000,
    currencyCode: "COP",
    createdAt: "2026-02-11",
    expiresAt: "2026-04-11",
    status: "active",
  },
  {
    id: "CC-103",
    scope: "client",
    customerId: "USR-003",
    bookingCode: "RES-79244",
    code: "REGRESOLAURA",
    description: "Saldo a favor generado por cancelacion propia del pasajero.",
    creationReason:
      "Cancelacion por decision del cliente con penalidad aplicada segun la politica vigente al momento del cambio.",
    valueType: "fixed_amount",
    valueAmount: 96000,
    currencyCode: "COP",
    createdAt: "2025-12-15",
    expiresAt: "2026-01-31",
    status: "inactive",
  },
];

export const toProductCouponItem = (coupon) => ({
  id: coupon.id,
  productId: coupon.productId,
  productName: getCouponProductName(coupon),
  couponName: coupon.code,
  description: buildProductCouponDescription(coupon),
  discountValue: formatCouponValueLabel(coupon),
  discountTarget: getCouponDiscountTargetLabel(coupon.discountTarget),
  createdAt: formatCouponDateLabel(coupon.createdAt),
  startsAt: formatCouponDateLabel(coupon.startsAt),
  endsAt: formatCouponDateLabel(coupon.endsAt),
  rule: formatProductCouponRuleLabel(coupon),
  status: getCouponStatusLabel(coupon.status),
});

export const toClientCouponItem = (coupon) => ({
  id: coupon.id,
  customerId: coupon.customerId,
  customerName: getCouponCustomerName(coupon),
  bookingCode: coupon.bookingCode,
  couponName: coupon.code,
  description: coupon.description,
  creationReason: coupon.creationReason,
  couponValue: formatCouponValueLabel(coupon),
  createdAt: formatCouponDateLabel(coupon.createdAt),
  expiresAt: formatCouponDateLabel(coupon.expiresAt),
  status: getCouponStatusLabel(coupon.status),
});

export const panelControlProductCoupons = panelControlCoupons.filter(
  (coupon) => coupon.scope === "product",
).map(toProductCouponItem);

export const panelControlClientCoupons = panelControlCoupons.filter(
  (coupon) => coupon.scope === "client",
).map(toClientCouponItem);
