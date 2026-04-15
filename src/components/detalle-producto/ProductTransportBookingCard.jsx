import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { usePanelSession } from "../../contexts/PanelSessionContext";
import { getCouponDiscountTargetLabel } from "../../data/couponsData";
import {
  evaluateProductCouponForBooking,
  findProductCouponByCode,
  getDateAvailableProductCoupons,
} from "../../utils/bookingCouponEngine";
import {
  getProductCategoryCssVars,
  getProductCategoryTheme,
} from "../../utils/productCategoryThemes";
import ProductReservationFlowModal from "./ProductReservationFlowModal";

function formatBookingPrice(value) {
  if (!value) {
    return null;
  }

  const normalizedValue = String(value).trim();
  const digits = normalizedValue.replace(/\D/g, "");

  if (digits) {
    return `$${new Intl.NumberFormat("es-CO").format(Number(digits))}`;
  }

  return normalizedValue.startsWith("$") ? normalizedValue : `$${normalizedValue}`;
}

const MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function formatMonthDayLabel(monthDay) {
  const [month, day] = String(monthDay ?? "").split("-");
  const monthIndex = Number(month) - 1;
  const dayNumber = Number(day);

  if (
    !Number.isInteger(monthIndex) ||
    monthIndex < 0 ||
    monthIndex >= MONTH_LABELS.length ||
    !Number.isInteger(dayNumber) ||
    dayNumber <= 0
  ) {
    return "";
  }

  return `${dayNumber} de ${MONTH_LABELS[monthIndex]}`;
}

function formatSeasonPeriodLabel(period = {}) {
  const label = String(period.label ?? "").trim();
  const startLabel = formatMonthDayLabel(period.startMonthDay);
  const endLabel = formatMonthDayLabel(period.endMonthDay);
  const rangeLabel =
    startLabel && endLabel ? `del ${startLabel} al ${endLabel}` : "";

  if (!label) {
    return rangeLabel || "Periodo por definir";
  }

  return label.toLowerCase().includes("del ") || label.toLowerCase().includes(startLabel)
    ? label
    : `${label}: ${rangeLabel}`;
}

function parseBookingPrice(value) {
  if (!value) {
    return 0;
  }

  const digits = String(value).replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function formatBookingAmount(value) {
  return `$${new Intl.NumberFormat("es-CO").format(Number(value ?? 0))}`;
}

function formatBookingDiscount(value) {
  return `- ${formatBookingAmount(value)}`;
}

function buildAvailableCouponDescription(coupon) {
  const description = coupon.description?.trim() ?? "";
  const discountTargetLabel = getCouponDiscountTargetLabel(coupon.discountTarget);
  return !description
    ? `sobre el ${discountTargetLabel}`
    : `${description}, sobre el ${discountTargetLabel}`;
}

function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseInputDate(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);
  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
}

function getClampedTravelDateValue(value, minDate, maxDate) {
  const parsedDate = parseInputDate(value);

  if (!parsedDate) {
    return "";
  }

  if (parsedDate < minDate) {
    return formatDateForInput(minDate);
  }

  if (parsedDate > maxDate) {
    return formatDateForInput(maxDate);
  }

  return value;
}

function isMonthDayWithinRange(monthDay, startMonthDay, endMonthDay) {
  if (!monthDay || !startMonthDay || !endMonthDay) {
    return false;
  }

  if (startMonthDay <= endMonthDay) {
    return monthDay >= startMonthDay && monthDay <= endMonthDay;
  }

  return monthDay >= startMonthDay || monthDay <= endMonthDay;
}

function getActiveSeasonKey(travelDate, seasons) {
  if (!travelDate || !seasons?.high?.periods?.length) {
    return null;
  }

  const [, month, day] = travelDate.split("-");
  const monthDay = `${month}-${day}`;

  return seasons.high.periods.some((period) =>
    isMonthDayWithinRange(monthDay, period.startMonthDay, period.endMonthDay),
  )
    ? "high"
    : "low";
}

export default function ProductTransportBookingCard({
  booking,
  initialTravelDate = "",
  meta = [],
  productCoupons = [],
  productSummary = null,
}) {
  const theme = getProductCategoryTheme("transporte");
  const categoryThemeStyle = getProductCategoryCssVars("transporte");
  const location = useLocation();
  const { isAuthenticated } = usePanelSession();
  const capacityMeta = meta.find((item) => item.label === "Capacidad");
  const capacityText = capacityMeta
    ? capacityMeta.value.replace(/hasta/i, "").trim().toLowerCase()
    : "la capacidad contratada";
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponFeedback, setCouponFeedback] = useState(null);
  const [reservationFeedback, setReservationFeedback] = useState("");

  const pricingDetails = booking.pricingDetails;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxTravelDate = new Date(today);
  maxTravelDate.setFullYear(maxTravelDate.getFullYear() + 1);
  const minTravelDateValue = formatDateForInput(today);
  const maxTravelDateValue = formatDateForInput(maxTravelDate);
  const [travelDate, setTravelDate] = useState(() =>
    getClampedTravelDateValue(initialTravelDate, today, maxTravelDate),
  );

  const seasonalPricing = pricingDetails?.seasons;
  const activeSeasonKey = getActiveSeasonKey(travelDate, seasonalPricing);
  const activeSeason =
    seasonalPricing?.[activeSeasonKey] ?? seasonalPricing?.low ?? null;
  const activePricingItem =
    activeSeason?.individual?.[0] ??
    pricingDetails?.individual?.[0] ?? {
      price: booking.price,
    };
  const unitPrice = parseBookingPrice(activePricingItem.price);

  const additionalCharges = booking.additionalCharges ?? [];
  const fixedChargesTotal = additionalCharges.reduce(
    (sum, item) =>
      item.type === "fixed" ? sum + parseBookingPrice(item.value) : sum,
    0,
  );
  const estimatedTotal = unitPrice + fixedChargesTotal;

  const passengerCounts = { adults: 1 };
  const passengerSubtotals = { adults: unitPrice };

  const availableCoupons = getDateAvailableProductCoupons({
    productId: booking.productId,
    travelDate,
    coupons: productCoupons,
  });

  const appliedCoupon = appliedCouponCode
    ? findProductCouponByCode(appliedCouponCode, booking.productId, productCoupons)
    : null;

  const appliedCouponEvaluation = appliedCoupon
    ? evaluateProductCouponForBooking({
        coupon: appliedCoupon,
        productId: booking.productId,
        passengerCounts,
        passengerSubtotals,
        travelDate,
        totalAmount: estimatedTotal,
      })
    : null;

  const activeAppliedCoupon = appliedCouponEvaluation?.isEligible
    ? appliedCouponEvaluation
    : null;
  const totalAfterDiscount =
    activeAppliedCoupon?.totalAfterDiscount ?? estimatedTotal;
  const startingPrice = booking.price || activePricingItem.price;

  const isHighSeasonActive = activeSeasonKey === "high";
  const highSeasonPeriodsLabel =
    seasonalPricing?.high?.periods
      ?.map((period) => formatSeasonPeriodLabel(period))
      .join(" - ") ?? "";

  useEffect(() => {
    if (!isPricingModalOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsPricingModalOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPricingModalOpen]);

  function handleTravelDateChange(event) {
    setTravelDate(getClampedTravelDateValue(event.target.value, today, maxTravelDate));
    setCouponCode("");
    setAppliedCouponCode("");
    setCouponFeedback(null);
    setReservationFeedback("");
  }

  function handleCouponCodeChange(event) {
    const normalizedValue = event.target.value.toUpperCase();
    setCouponCode(normalizedValue);

    if (appliedCouponCode && normalizedValue.trim() !== appliedCouponCode) {
      setAppliedCouponCode("");
    }

    if (couponFeedback) {
      setCouponFeedback(null);
    }
  }

  function showCouponError(message) {
    setCouponFeedback({ tone: "error", message });
  }

  function handleApplyCoupon() {
    const normalizedCode = couponCode.trim().toUpperCase();

    if (!normalizedCode) {
      return showCouponError("Digita un codigo de cupon antes de aplicarlo.");
    }

    if (!travelDate) {
      return showCouponError("Selecciona primero la fecha de viaje para validar el cupon.");
    }

    const selectedCoupon = findProductCouponByCode(
      normalizedCode,
      booking.productId,
      productCoupons,
    );

    if (!selectedCoupon) {
      setAppliedCouponCode("");
      return showCouponError("El codigo ingresado no existe para este producto.");
    }

    const evaluation = evaluateProductCouponForBooking({
      coupon: selectedCoupon,
      productId: booking.productId,
      passengerCounts,
      passengerSubtotals,
      travelDate,
      totalAmount: estimatedTotal,
    });

    if (!evaluation.isEligible) {
      setAppliedCouponCode("");
      return showCouponError(
        evaluation.reason || "La reserva no cumple las condiciones del cupon.",
      );
    }

    setAppliedCouponCode(normalizedCode);
    setCouponCode(normalizedCode);
    setCouponFeedback({
      tone: "success",
      message: `${selectedCoupon.code} aplicado correctamente.`,
    });
  }

  function handleOpenReservationFlow() {
    if (!travelDate) {
      setReservationFeedback(
        "Selecciona primero la fecha del servicio para continuar.",
      );
      return;
    }

    if (!isAuthenticated) {
      setReservationFeedback(
        "Inicia sesión con un usuario operativo de LDS para continuar con la reserva.",
      );
      return;
    }

    setReservationFeedback("");
    setIsReservationModalOpen(true);
  }

  const bookingSnapshot = {
    productId: booking.productId,
    productName: productSummary?.title ?? "Producto LDS",
    productCity: productSummary?.city ?? "",
    productDetailPath: location.pathname,
    travelDate,
    departureTime: productSummary?.departureTime ?? "",
    passengerCounts: { adults: 1 },
    passengerFields: [
      { id: "adults", label: "Adulto", min: 1, defaultValue: 1 },
    ],
    passengerBreakdown: [
      {
        id: "adults",
        label: "Servicio de transporte",
        count: 1,
        unitPrice,
        subtotal: unitPrice,
      },
    ],
    additionalCharges: additionalCharges.map((item) => ({
      ...item,
      value:
        item.type === "fixed" ? parseBookingPrice(item.value) : item.value,
    })),
    estimatedTotal,
    discountAmount: activeAppliedCoupon?.discountAmount ?? 0,
    totalAfterDiscount,
    appliedCouponCode: activeAppliedCoupon?.coupon?.code ?? "",
    appliedCouponLabel: activeAppliedCoupon?.coupon?.name ?? "",
    summaryNote: "Reserva de transporte exclusivo.",
  };

  return (
    <>
      <aside
        className="detalle-producto-booking-card"
        style={{
          ...categoryThemeStyle,
          background: "#ffffff",
          overflow: "hidden",
          borderRadius: "12px",
          boxShadow: `0 10px 25px ${theme.shadow}`,
          padding: "0",
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
            padding: "1.5rem 1.5rem 1.25rem 1.5rem",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              margin: "0",
              color: "#ffffff",
              fontSize: "1.3rem",
              fontWeight: "800",
              letterSpacing: "0.5px",
            }}
          >
            Transporte Exclusivo
          </h3>
          <div
            style={{
              margin: "0.75rem auto 1rem",
              background: "rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              padding: "0.6rem 1.2rem",
              borderRadius: "30px",
              display: "inline-block",
              fontSize: "1.1rem",
              fontWeight: "700",
              backdropFilter: "blur(4px)",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            }}
          >
            Cubre desde 1 hasta {capacityText}
          </div>

          <div
            className="detalle-producto-booking-top"
            style={{
              margin: "0",
              padding: "0",
              background: "transparent",
              border: "none",
              alignItems: "center",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <strong
              style={{
                lineHeight: "1",
                color: "#ffffff",
                fontSize: "2rem",
              }}
            >
              {formatBookingPrice(startingPrice)}
            </strong>
            <small
              style={{
                margin: "0.25rem 0 0",
                color: "rgba(255, 255, 255, 0.85)",
                fontSize: "0.9rem",
              }}
            >
              {booking.unitLabel ?? "por trayecto"}
            </small>
            {pricingDetails ? (
              <button
                type="button"
                className="detalle-producto-booking-info-link"
                onClick={() => setIsPricingModalOpen(true)}
                style={{
                  marginTop: "0.5rem",
                  color: "#ffffff",
                  textDecoration: "underline",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  opacity: "0.9",
                }}
              >
                Ver calendario de tarifas
              </button>
            ) : null}
          </div>
        </div>

        <div style={{ padding: "1.5rem", background: "#ffffff" }}>
          <div
            className="detalle-producto-booking-form"
            style={{ marginTop: "0", padding: "0" }}
          >
            <label>
              <span
                style={{
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  display: "block",
                  color: "#374151",
                }}
              >
                Fecha de Servicio
              </span>
              <input
                type="date"
                value={travelDate}
                min={minTravelDateValue}
                max={maxTravelDateValue}
                onChange={handleTravelDateChange}
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  borderRadius: "8px",
                  border: `1px solid ${theme.surfaceStrong}`,
                  color: "#1f2937",
                  background: theme.surface,
                }}
              />
            </label>
          </div>

          <div
            className="detalle-producto-booking-coupons"
            style={{ marginTop: "1rem" }}
          >
            <div className="detalle-producto-booking-coupons-head">
              <span style={{ color: "#4b5563" }}>Cupones disponibles</span>
            </div>

            {!travelDate ? (
              <p
                className="detalle-producto-booking-coupons-empty"
                style={{ color: "#6b7280" }}
              >
                Ingresa una fecha para verificar promociones.
              </p>
            ) : availableCoupons.length ? (
              <div
                className="detalle-producto-booking-coupon-list"
                style={{ marginTop: "0.5rem" }}
              >
                {availableCoupons.map((coupon) => (
                  <article
                    className="detalle-producto-booking-coupon-card"
                    key={coupon.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      padding: "0.5rem",
                    }}
                  >
                    <strong style={{ color: "#1f2937" }}>{coupon.code}</strong>
                    <p
                      style={{
                        color: "#4b5563",
                        fontSize: "0.85rem",
                        margin: "0",
                      }}
                    >
                      {buildAvailableCouponDescription(coupon)}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p
                className="detalle-producto-booking-coupons-empty"
                style={{ color: "#6b7280" }}
              >
                No hay cupones activos.
              </p>
            )}
          </div>

          {isHighSeasonActive ? (
            <div
              className="detalle-producto-booking-inline-alert"
              style={{ marginTop: "1rem" }}
            >
              <div
                className="detalle-producto-booking-season-alert"
                style={{
                  background: theme.softAlt,
                  color: theme.accent,
                  borderColor: theme.surfaceStrong,
                }}
              >
                <div className="detalle-producto-booking-alert-copy">
                  <p style={{ fontWeight: "600", margin: "0" }}>
                    Tarifa alta activa
                  </p>
                  <small>{highSeasonPeriodsLabel}</small>
                </div>
                <span
                  className="material-icons-outlined detalle-producto-booking-alert-icon"
                  aria-hidden="true"
                >
                  trending_up
                </span>
              </div>
            </div>
          ) : null}

          <div
            className="detalle-producto-booking-breakdown"
            style={{
              marginTop: "1.5rem",
              borderTop: "2px dashed #e5e7eb",
              paddingTop: "1rem",
            }}
          >
            <div
              className="detalle-producto-booking-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ color: "#4b5563" }}>Valor Trayecto/Vehículo</span>
              <strong style={{ color: "#1f2937" }}>
                {formatBookingAmount(unitPrice)}
              </strong>
            </div>

            {additionalCharges.map((item) => (
              <div
                className="detalle-producto-booking-row"
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <span style={{ color: "#4b5563" }}>{item.label}</span>
                <strong style={{ color: "#1f2937" }}>
                  {item.type === "fixed"
                    ? formatBookingAmount(parseBookingPrice(item.value))
                    : item.value}
                </strong>
              </div>
            ))}

            <div
              className="detalle-producto-booking-row detalle-producto-booking-row--total"
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1.1rem",
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid #e5e7eb",
                color: theme.primary,
              }}
            >
              <span>Total estimado</span>
              <strong>{formatBookingAmount(estimatedTotal)}</strong>
            </div>

            {activeAppliedCoupon ? (
              <>
                <div
                  className="detalle-producto-booking-row detalle-producto-booking-row--discount"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#059669",
                    marginTop: "0.5rem",
                  }}
                >
                  <span>Cupón {activeAppliedCoupon.coupon.code}</span>
                  <strong>
                    {formatBookingDiscount(activeAppliedCoupon.discountAmount)}
                  </strong>
                </div>
                <div
                  className="detalle-producto-booking-row detalle-producto-booking-row--final"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "1.2rem",
                    fontWeight: "700",
                    marginTop: "0.5rem",
                    color: "#111827",
                  }}
                >
                  <span>Total final</span>
                  <strong>{formatBookingAmount(totalAfterDiscount)}</strong>
                </div>
              </>
            ) : null}
          </div>

          <div
            className="detalle-producto-booking-coupon-form"
            style={{ marginTop: "1rem" }}
          >
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                value={couponCode}
                onChange={handleCouponCodeChange}
                placeholder="Ej. CACAO10"
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                }}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                style={{
                  padding: "0.75rem 1rem",
                  background: "#f3f4f6",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontWeight: "600",
                  cursor: "pointer",
                  color: "#374151",
                }}
              >
                Aplicar
              </button>
            </div>
            {couponFeedback ? (
              <p
                className={`detalle-producto-booking-coupon-feedback detalle-producto-booking-coupon-feedback--${couponFeedback.tone}`}
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.85rem",
                  color: couponFeedback.tone === "error" ? "#dc2626" : "#059669",
                }}
              >
                {couponFeedback.message}
              </p>
            ) : null}
          </div>

          <div
            className="detalle-producto-booking-action"
            style={{ marginTop: "1.5rem" }}
          >
            {reservationFeedback ? (
              <div className="detalle-producto-booking-feedback detalle-producto-booking-feedback--error">
                {reservationFeedback}
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleOpenReservationFlow}
              style={{
                width: "100%",
                padding: "1rem",
                background: theme.accent,
                color: "#ffffff",
                borderRadius: "8px",
                border: "none",
                fontSize: "1rem",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                transition: "background 0.2s",
              }}
              onMouseOver={(event) => {
                event.currentTarget.style.background = theme.secondary;
              }}
              onMouseOut={(event) => {
                event.currentTarget.style.background = theme.accent;
              }}
            >
              {booking.buttonLabel ?? "Reservar Vehículo"}
            </button>
          </div>
        </div>
      </aside>

      {isPricingModalOpen && pricingDetails && createPortal(
        <div
          className="detalle-producto-booking-modal-backdrop"
          onClick={() => setIsPricingModalOpen(false)}
        >
          <div
            className="detalle-producto-booking-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="detalle-producto-booking-modal-close"
              onClick={() => setIsPricingModalOpen(false)}
            >
              &times;
            </button>
            <div className="detalle-producto-booking-modal-head">
              <h3 id="detalle-producto-booking-modal-title">
                Tarifas del Vehículo
              </h3>
            </div>

            {seasonalPricing && ["low", "high"].map((seasonKey) => {
              const season = seasonalPricing[seasonKey];

              if (!season) {
                return null;
              }

              return (
                <div className="detalle-producto-booking-modal-section" key={seasonKey}>
                  <h4>{season.title}</h4>
                  {season.note ? (
                    <p className="detalle-producto-booking-modal-rule">
                      {season.note}
                    </p>
                  ) : null}
                  {season.periods?.length > 0 ? (
                    <div className="detalle-producto-booking-modal-rule">
                      <p>Fechas:</p>
                      <ul>
                        {season.periods.map((period) => (
                          <li key={period.id}>{formatSeasonPeriodLabel(period)}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div
                    style={{
                      padding: "1rem",
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      marginTop: "0.5rem",
                      textAlign: "center",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <strong
                      style={{
                        fontSize: "1.2rem",
                        color: seasonKey === "high" ? "#c53030" : "#0f766e",
                      }}
                    >
                      {formatBookingPrice(season.individual[0]?.price || booking.price)}
                    </strong>
                    <p
                      style={{
                        margin: "0.2rem 0 0",
                        fontSize: "0.85rem",
                        color: "#6b7280",
                      }}
                    >
                      {booking.unitLabel ?? "por trayecto"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>,
        document.body,
      )}

      <ProductReservationFlowModal
        open={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        bookingSnapshot={bookingSnapshot}
      />
    </>
  );
}
