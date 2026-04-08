import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  formatProductCouponRuleLabel,
  getCouponDiscountTargetLabel,
} from "../../data/couponsData";
import {
  evaluateProductCouponForBooking,
  findProductCouponByCode,
  getDateAvailableProductCoupons,
} from "../../utils/bookingCouponEngine";
import { getProductCategoryCssVars } from "../../utils/productCategoryThemes";

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

  const normalizedLabel = label.toLowerCase();

  if (
    !rangeLabel ||
    normalizedLabel.includes("del ") ||
    normalizedLabel.includes(startLabel) ||
    normalizedLabel.includes(endLabel)
  ) {
    return label;
  }

  return `${label}: ${rangeLabel}`;
}

function parseBookingPrice(value) {
  if (!value) {
    return 0;
  }

  const digits = String(value).replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function formatBookingAmount(value) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

function formatBookingDiscount(value) {
  return `- ${formatBookingAmount(value)}`;
}

function buildAvailableCouponDescription(coupon) {
  const description = coupon.description?.trim() ?? "";
  const discountTargetLabel = getCouponDiscountTargetLabel(coupon.discountTarget);

  if (!description) {
    return `sobre el ${discountTargetLabel}`;
  }

  return `${description}, sobre el ${discountTargetLabel}`;
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

function getAdultPrice(items = []) {
  const adultPrice = items.find((item) => item.id === "adults")?.price;
  return adultPrice ? adultPrice : null;
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

function getInitialPassengerCounts(fields) {
  return fields.reduce((accumulator, field) => {
    accumulator[field.id] = field.defaultValue ?? field.min ?? 0;
    return accumulator;
  }, {});
}

function getPassengerPricingState(
  fields,
  passengerCounts,
  activeIndividualPricing,
  activeGroupPricing,
  groupMinPassengers,
) {
  const totalPassengers = fields.reduce(
    (sum, field) => sum + Number(passengerCounts[field.id] ?? 0),
    0,
  );
  const isGroupPricingActive = totalPassengers >= groupMinPassengers;
  const appliedPassengerPricing = isGroupPricingActive
    ? activeGroupPricing
    : activeIndividualPricing;
  const passengerBreakdown = fields
    .map((field) => {
      const count = Number(passengerCounts[field.id] ?? 0);
      const pricingItem =
        appliedPassengerPricing.find((item) => item.id === field.id) ??
        activeIndividualPricing.find((item) => item.id === field.id);
      const unitPrice = parseBookingPrice(pricingItem?.price);

      return {
        id: field.id,
        label: field.label,
        count,
        subtotal: count * unitPrice,
      };
    })
    .filter((item) => item.count > 0);
  const passengerSubtotal = passengerBreakdown.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );
  const passengerSubtotals = passengerBreakdown.reduce((accumulator, item) => {
    accumulator[item.id] = item.subtotal;
    return accumulator;
  }, {});

  return {
    totalPassengers,
    isGroupPricingActive,
    appliedPassengerPricing,
    passengerBreakdown,
    passengerSubtotal,
    passengerSubtotals,
  };
}

export default function ProductBookingCard({
  booking,
  initialTravelDate = "",
}) {
  const categoryThemeStyle = getProductCategoryCssVars("actividades");
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponFeedback, setCouponFeedback] = useState(null);
  const [couponErrorAnimationVersion, setCouponErrorAnimationVersion] = useState(0);
  const passengerFields = booking.passengerFields ?? [
    { id: "adults", label: "Adultos", min: 1, defaultValue: 2 },
    { id: "children", label: "Ninos", min: 0, defaultValue: 0 },
    { id: "babies", label: "Bebes", min: 0, defaultValue: 0 },
  ];
  const [passengerCounts, setPassengerCounts] = useState(() =>
    getInitialPassengerCounts(passengerFields),
  );

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
  const activeIndividualPricing =
    activeSeason?.individual ?? pricingDetails?.individual ?? [];
  const activeGroupPricing = activeSeason?.group ?? pricingDetails?.group ?? [];
  const groupMinPassengers = pricingDetails?.groupMinPassengers ?? 9999;
  const {
    isGroupPricingActive,
    appliedPassengerPricing,
    passengerBreakdown,
    passengerSubtotal,
    passengerSubtotals,
  } = getPassengerPricingState(
    passengerFields,
    passengerCounts,
    activeIndividualPricing,
    activeGroupPricing,
    groupMinPassengers,
  );
  const additionalCharges = booking.additionalCharges ?? [];
  const fixedChargesTotal = additionalCharges.reduce(
    (sum, item) =>
      item.type === "fixed" ? sum + parseBookingPrice(item.value) : sum,
    0,
  );
  const estimatedTotal = passengerSubtotal + fixedChargesTotal;
  const availableCoupons = getDateAvailableProductCoupons({
    productId: booking.productId,
    travelDate,
  });
  const appliedCoupon = appliedCouponCode
    ? findProductCouponByCode(appliedCouponCode, booking.productId)
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
  const startingPrice =
    getAdultPrice(appliedPassengerPricing) ??
    getAdultPrice(activeIndividualPricing) ??
    booking.price ??
    getAdultPrice(pricingDetails?.individual);
  const isHighSeasonActive = activeSeasonKey === "high";
  const isLowSeasonActive = activeSeasonKey === "low";
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

  function handlePassengerChange(field, value) {
    const numericValue = Number(value);
    const safeValue = Number.isNaN(numericValue) ? 0 : numericValue;
    const min = field.min ?? 0;
    let nextPassengerCounts = passengerCounts;

    setPassengerCounts((current) => {
      nextPassengerCounts = {
        ...current,
        [field.id]: Math.max(min, safeValue),
      };

      return nextPassengerCounts;
    });

    if (!appliedCouponCode) {
      return;
    }

    const selectedCoupon = findProductCouponByCode(
      appliedCouponCode,
      booking.productId,
    );

    if (!selectedCoupon) {
      setAppliedCouponCode("");
      return;
    }

    const nextPricingState = getPassengerPricingState(
      passengerFields,
      nextPassengerCounts,
      activeIndividualPricing,
      activeGroupPricing,
      groupMinPassengers,
    );
    const evaluation = evaluateProductCouponForBooking({
      coupon: selectedCoupon,
      productId: booking.productId,
      passengerCounts: nextPassengerCounts,
      passengerSubtotals: nextPricingState.passengerSubtotals,
      travelDate,
      totalAmount: nextPricingState.passengerSubtotal + fixedChargesTotal,
    });

    if (!evaluation.isEligible) {
      setAppliedCouponCode("");
      showCouponError(
        evaluation.reason ||
          "El cupon ya no aplica con la configuracion actual de la reserva.",
      );
    }
  }

  function handleTravelDateChange(event) {
    setTravelDate(
      getClampedTravelDateValue(event.target.value, today, maxTravelDate),
    );
    setCouponCode("");
    setAppliedCouponCode("");
    setCouponFeedback(null);
  }

  function handleCouponCodeChange(event) {
    const normalizedValue = event.target.value.toUpperCase();

    setCouponCode(normalizedValue);

    if (
      appliedCouponCode &&
      normalizedValue.trim() !== appliedCouponCode
    ) {
      setAppliedCouponCode("");
    }

    if (couponFeedback) {
      setCouponFeedback(null);
    }
  }

  function showCouponError(message) {
    setCouponFeedback({
      tone: "error",
      message,
    });
    setCouponErrorAnimationVersion((current) => current + 1);
  }

  function handleApplyCoupon() {
    const normalizedCode = couponCode.trim().toUpperCase();

    if (!normalizedCode) {
      showCouponError("Digita un codigo de cupon antes de aplicarlo.");
      return;
    }

    if (!travelDate) {
      showCouponError("Selecciona primero la fecha de viaje para validar el cupon.");
      return;
    }

    const selectedCoupon = findProductCouponByCode(
      normalizedCode,
      booking.productId,
    );

    if (!selectedCoupon) {
      setAppliedCouponCode("");
      showCouponError("El codigo ingresado no existe para este producto.");
      return;
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
      showCouponError(
        evaluation.reason ||
          "La reserva no cumple las condiciones del cupon.",
      );
      return;
    }

    setAppliedCouponCode(normalizedCode);
    setCouponCode(normalizedCode);
    setCouponFeedback({
      tone: "success",
      message: `${selectedCoupon.code} aplicado correctamente a esta reserva.`,
    });
  }

  return (
    <>
      <aside className="detalle-producto-booking-card" style={categoryThemeStyle}>
        <div className="detalle-producto-booking-top">
          <div className="detalle-producto-booking-top-row">
            <span>Tarifa</span>
            {pricingDetails ? (
              <button
                type="button"
                className="detalle-producto-booking-info-link"
                onClick={() => setIsPricingModalOpen(true)}
              >
                Mas informacion
              </button>
            ) : null}
          </div>
          <strong>{formatBookingPrice(startingPrice)}</strong>
          <small>{booking.unitLabel ?? "por persona"}</small>
        </div>

        <div className="detalle-producto-booking-form">
          <label>
            <span>Fecha</span>
            <input
              type="date"
              value={travelDate}
              min={minTravelDateValue}
              max={maxTravelDateValue}
              onChange={handleTravelDateChange}
            />
          </label>

          <div className="detalle-producto-booking-passengers">
            <span>Pasajeros</span>

            <div className="detalle-producto-booking-passenger-grid">
              {passengerFields.map((field) => (
                <label key={field.id}>
                  <span>{field.label}</span>
                  {field.ageHint ? (
                    <small className="detalle-producto-booking-passenger-hint">
                      {field.ageHint}
                    </small>
                  ) : null}
                  <input
                    type="number"
                    min={field.min ?? 0}
                    value={passengerCounts[field.id] ?? field.defaultValue ?? 0}
                    onChange={(event) =>
                      handlePassengerChange(field, event.target.value)
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="detalle-producto-booking-coupons">
          <div className="detalle-producto-booking-coupons-head">
            <span>Cupones disponibles</span>
            {travelDate ? (
              <small>
                {availableCoupons.length} disponibles para la fecha seleccionada
              </small>
            ) : (
              <small>Selecciona una fecha para ver opciones disponibles</small>
            )}
          </div>

          {!travelDate ? (
            <p className="detalle-producto-booking-coupons-empty">
              El sistema mostrara aqui los codigos disponibles para este producto
              cuando elijas una fecha de viaje.
            </p>
          ) : availableCoupons.length ? (
            <div className="detalle-producto-booking-coupon-list">
              {availableCoupons.map((coupon) => (
                <article
                  className="detalle-producto-booking-coupon-card"
                  key={coupon.id}
                >
                  <strong>{coupon.code}</strong>
                  <p>{buildAvailableCouponDescription(coupon)}</p>
                  <p className="detalle-producto-booking-coupon-rule">
                    {formatProductCouponRuleLabel(coupon)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="detalle-producto-booking-coupons-empty">
              No hay cupones activos para este producto en la fecha seleccionada.
            </p>
          )}
        </div>

        {isHighSeasonActive ? (
          <div className="detalle-producto-booking-inline-alert">
            <div className="detalle-producto-booking-season-alert">
              <div className="detalle-producto-booking-alert-copy">
                <p>Tarifa de temporada alta</p>
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

        {isLowSeasonActive ? (
          <div className="detalle-producto-booking-inline-alert">
            <div className="detalle-producto-booking-season-alert detalle-producto-booking-season-alert--low">
              <div className="detalle-producto-booking-alert-copy">
                <p>Tarifa de temporada baja</p>
                <small>{activeSeason?.note}</small>
              </div>
              <span
                className="material-icons-outlined detalle-producto-booking-alert-icon"
                aria-hidden="true"
              >
                trending_down
              </span>
            </div>
          </div>
        ) : null}

        {isGroupPricingActive ? (
          <div className="detalle-producto-booking-inline-alert">
            <div className="detalle-producto-booking-group-alert">
              <div className="detalle-producto-booking-alert-copy">
                <p>Tarifa para grupos aplicada</p>
                <small>
                  Alcanzaste el minimo de {groupMinPassengers} pasajeros para grupo.
                </small>
              </div>
              <span
                className="material-icons-outlined detalle-producto-booking-alert-icon"
                aria-hidden="true"
              >
                groups
              </span>
            </div>
          </div>
        ) : null}

        <div className="detalle-producto-booking-breakdown">
          {passengerBreakdown.map((item) => (
            <div className="detalle-producto-booking-row" key={item.id}>
              <span>{`${item.label} x${item.count}`}</span>
              <strong>{formatBookingAmount(item.subtotal)}</strong>
            </div>
          ))}

          {additionalCharges.map((item) => (
            <div className="detalle-producto-booking-row" key={item.label}>
              <span>{item.label}</span>
              <strong>
                {item.type === "fixed"
                  ? formatBookingAmount(parseBookingPrice(item.value))
                  : item.value}
              </strong>
            </div>
          ))}

          <div className="detalle-producto-booking-row detalle-producto-booking-row--total">
            <span>Total estimado</span>
            <strong>{formatBookingAmount(estimatedTotal)}</strong>
          </div>

          {activeAppliedCoupon ? (
            <>
              <div className="detalle-producto-booking-row detalle-producto-booking-row--discount">
                <span>{`Descuento cupon ${activeAppliedCoupon.coupon.code}`}</span>
                <strong>{formatBookingDiscount(activeAppliedCoupon.discountAmount)}</strong>
              </div>

              <p className="detalle-producto-booking-discount-base">
                {`Aplicado sobre ${activeAppliedCoupon.discountTargetLabel.toLowerCase()}.`}
              </p>

              <div className="detalle-producto-booking-row detalle-producto-booking-row--final">
                <span>Total con cupon</span>
                <strong>{formatBookingAmount(totalAfterDiscount)}</strong>
              </div>
            </>
          ) : null}
        </div>

        <div className="detalle-producto-booking-coupon-form">
          <label className="detalle-producto-booking-coupon-input">
            <span>Aplicar cupon</span>
            <input
              type="text"
              value={couponCode}
              onChange={handleCouponCodeChange}
              placeholder="Ej. CACAO10"
              autoComplete="off"
            />
          </label>

          <button
            type="button"
            className="detalle-producto-booking-coupon-button"
            onClick={handleApplyCoupon}
          >
            Aplicar cupon
          </button>

          {couponFeedback ? (
            <p
              key={
                couponFeedback.tone === "error"
                  ? `error-${couponErrorAnimationVersion}`
                  : `success-${couponFeedback.message}`
              }
              className={`detalle-producto-booking-coupon-feedback detalle-producto-booking-coupon-feedback--${couponFeedback.tone}`}
            >
              {couponFeedback.message}
            </p>
          ) : null}
        </div>

        <p className="detalle-producto-booking-note">{booking.note}</p>

        <div className="detalle-producto-booking-action">
          <button type="button">{booking.buttonLabel ?? "Reservar ahora"}</button>
        </div>
      </aside>

      {isPricingModalOpen && pricingDetails
        ? createPortal(
            <div
              className="detalle-producto-booking-modal-backdrop"
              onClick={() => setIsPricingModalOpen(false)}
              role="presentation"
            >
              <div
                className="detalle-producto-booking-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="detalle-producto-booking-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="detalle-producto-booking-modal-close"
                  onClick={() => setIsPricingModalOpen(false)}
                  aria-label="Cerrar informacion de tarifas"
                >
                  &times;
                </button>

                <div className="detalle-producto-booking-modal-head">
                  <p>Tarifas del producto</p>
                  <h3 id="detalle-producto-booking-modal-title">
                    Informacion de precios
                  </h3>
                </div>

                {seasonalPricing ? (
                  ["low", "high"].map((seasonKey) => {
                    const season = seasonalPricing[seasonKey];
                    if (!season) {
                      return null;
                    }

                    return (
                      <div
                        className="detalle-producto-booking-modal-section"
                        key={seasonKey}
                      >
                        <h4>{season.title}</h4>
                        {season.note ? (
                          <p className="detalle-producto-booking-modal-rule">
                            {season.note}
                          </p>
                        ) : null}
                        {season.periods?.length ? (
                          <div className="detalle-producto-booking-modal-rule">
                            <p>Fechas:</p>
                            <ul className="detalle-producto-booking-modal-periods">
                              {season.periods.map((period) => (
                                <li key={period.id}>
                                  {formatSeasonPeriodLabel(period)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        <div className="detalle-producto-booking-modal-grid">
                          {season.individual?.map((item) => (
                            <article
                              className={`detalle-producto-booking-modal-card${
                                seasonKey === "high"
                                  ? " detalle-producto-booking-modal-card--high"
                                  : ""
                              }`}
                              key={`${seasonKey}-individual-${item.id}`}
                            >
                              <span>{item.label}</span>
                              {item.ageHint ? <small>{item.ageHint}</small> : null}
                              <strong>{formatBookingPrice(item.price)}</strong>
                            </article>
                          ))}
                        </div>

                        <h4 className="detalle-producto-booking-modal-subhead">
                          Tarifa para grupos
                        </h4>
                        <p className="detalle-producto-booking-modal-rule">
                          {pricingDetails.groupRule}
                        </p>
                        <div className="detalle-producto-booking-modal-grid">
                          {season.group?.map((item) => (
                            <article
                              className={`detalle-producto-booking-modal-card detalle-producto-booking-modal-card--group${
                                seasonKey === "high"
                                  ? " detalle-producto-booking-modal-card--high"
                                  : ""
                              }`}
                              key={`${seasonKey}-group-${item.id}`}
                            >
                              <span>{item.label}</span>
                              {item.ageHint ? <small>{item.ageHint}</small> : null}
                              <strong>{formatBookingPrice(item.price)}</strong>
                            </article>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="detalle-producto-booking-modal-section">
                    <h4>Tarifa regular</h4>
                    <div className="detalle-producto-booking-modal-grid">
                      {pricingDetails.individual?.map((item) => (
                        <article
                          className="detalle-producto-booking-modal-card"
                          key={`individual-${item.id}`}
                        >
                          <span>{item.label}</span>
                          {item.ageHint ? <small>{item.ageHint}</small> : null}
                          <strong>{formatBookingPrice(item.price)}</strong>
                        </article>
                      ))}
                    </div>

                    <h4 className="detalle-producto-booking-modal-subhead">
                      Tarifa para grupos
                    </h4>
                    <p className="detalle-producto-booking-modal-rule">
                      {pricingDetails.groupRule}
                    </p>
                    <div className="detalle-producto-booking-modal-grid">
                      {activeGroupPricing.map((item) => (
                        <article
                          className="detalle-producto-booking-modal-card detalle-producto-booking-modal-card--group"
                          key={`group-${item.id}`}
                        >
                          <span>{item.label}</span>
                          {item.ageHint ? <small>{item.ageHint}</small> : null}
                          <strong>{formatBookingPrice(item.price)}</strong>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
