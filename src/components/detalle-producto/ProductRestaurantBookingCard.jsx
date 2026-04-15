import { useState } from "react";

import { useLocation } from "react-router-dom";

import { usePanelSession } from "../../contexts/PanelSessionContext";
import {
  getProductCategoryCssVars,
  getProductCategoryTheme,
} from "../../utils/productCategoryThemes";
import ProductReservationFlowModal from "./ProductReservationFlowModal";

function formatBookingAmount(value) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

function parseBookingPrice(value) {
  return value ? Number(String(value).replace(/\D/g, "")) : 0;
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
  if (!travelDate) {
    return "low";
  }

  const [year, month, day] = travelDate.split("-");

  if (!year || !month || !day) {
    return "low";
  }

  if (!seasons?.high?.periods?.length) {
    return "low";
  }

  const monthDay = `${month}-${day}`;

  return seasons.high.periods.some((period) =>
    isMonthDayWithinRange(monthDay, period.startMonthDay, period.endMonthDay),
  )
    ? "high"
    : "low";
}

export default function ProductRestaurantBookingCard({
  booking,
  initialTravelDate = "",
  productSummary = null,
}) {
  const theme = getProductCategoryTheme("restaurantes");
  const categoryThemeStyle = getProductCategoryCssVars("restaurantes");
  const location = useLocation();
  const { isAuthenticated } = usePanelSession();
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [reservationFeedback, setReservationFeedback] = useState("");

  const { foodStyle, serviceFormat, openingTime, closingTime } =
    booking.metaRestaurant || {};

  const passengerFields = booking.passengerFields ?? [
    { id: "adults", label: "Comensales adultos", min: 1, defaultValue: 2 },
    { id: "children", label: "Ninos", min: 0, defaultValue: 0 },
    { id: "babies", label: "Bebes", min: 0, defaultValue: 0 },
  ];

  const [passengerCounts, setPassengerCounts] = useState(() =>
    passengerFields.reduce(
      (accumulator, field) => ({
        ...accumulator,
        [field.id]: field.defaultValue ?? 0,
      }),
      {},
    ),
  );

  const pricingDetails = booking.pricingDetails;
  const [travelDate, setTravelDate] = useState(
    initialTravelDate || new Date().toISOString().split("T")[0],
  );

  const seasonalPricing = pricingDetails?.seasons;
  const activeSeasonKey = getActiveSeasonKey(travelDate, seasonalPricing);
  const activeSeason =
    seasonalPricing?.[activeSeasonKey] ?? seasonalPricing?.low ?? null;
  const activeIndividualPricing =
    activeSeason?.individual ?? pricingDetails?.individual ?? [];

  const passengerBreakdown = passengerFields
    .map((field) => {
      const count = passengerCounts[field.id] || 0;
      const priceItem = activeIndividualPricing.find(
        (pricingItem) => pricingItem.id === field.id,
      );
      const unitPrice = parseBookingPrice(priceItem?.price);

      return {
        id: field.id,
        label: field.label,
        count,
        subtotal: count * unitPrice,
      };
    })
    .filter((item) => item.count > 0);

  const estimatedTotal = passengerBreakdown.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );

  function handleOpenReservationFlow() {
    const totalPassengers = passengerBreakdown.reduce(
      (sum, item) => sum + Number(item.count ?? 0),
      0,
    );

    if (!travelDate) {
      setReservationFeedback(
        "Selecciona primero la fecha de la reserva para continuar.",
      );
      return;
    }

    if (totalPassengers <= 0) {
      setReservationFeedback(
        "Debes indicar al menos un comensal antes de continuar.",
      );
      return;
    }

    if (!isAuthenticated) {
      setReservationFeedback(
        "Inicia sesion con un usuario operativo de LDS para continuar con la reserva.",
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
    departureTime: openingTime ?? productSummary?.departureTime ?? "",
    passengerCounts,
    passengerFields,
    passengerBreakdown: passengerBreakdown.map((item) => ({
      ...item,
      unitPrice: item.count > 0 ? Math.round(item.subtotal / item.count) : 0,
    })),
    additionalCharges: [],
    estimatedTotal,
    discountAmount: 0,
    totalAfterDiscount: estimatedTotal,
    appliedCouponCode: "",
    appliedCouponLabel: "",
    summaryNote:
      booking.note ??
      `Reserva de restaurante ${foodStyle || "gastronomico"} con servicio ${
        serviceFormat || "por definir"
      }.`,
  };

  return (
    <>
      <aside
        className="detalle-producto-booking-card restaurant-theme"
        style={categoryThemeStyle}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
            padding: "1.5rem",
            borderRadius: "16px 16px 0 0",
            color: "#fff",
            textAlign: "center",
            boxShadow: "inset 0 -10px 20px rgba(0,0,0,0.05)",
          }}
        >
          <span
            className="material-icons-outlined"
            style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
          >
            restaurant
          </span>
          <h3
            style={{
              margin: 0,
              fontSize: "1.2rem",
              fontWeight: "800",
              letterSpacing: "0.5px",
            }}
          >
            EXPERIENCIA GOURMET
          </h3>
          {foodStyle ? (
            <div
              style={{
                fontSize: "0.9rem",
                marginTop: "0.4rem",
                background: "rgba(255,255,255,0.2)",
                padding: "2px 10px",
                borderRadius: "20px",
                display: "inline-block",
              }}
            >
              Cocina {foodStyle}
            </div>
          ) : null}
        </div>

        <div
          style={{
            padding: "1.5rem",
            background: "#fff",
            borderRadius: "0 0 16px 16px",
          }}
        >
          {openingTime || closingTime ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#666",
                fontSize: "0.85rem",
                marginBottom: "1rem",
                padding: "0.5rem",
                background: theme.soft,
                borderRadius: "8px",
                border: `1px dashed ${theme.surfaceStrong}`,
              }}
            >
              <span
                className="material-icons-outlined"
                style={{ fontSize: "1.2rem", color: theme.primary }}
              >
                schedule
              </span>
              <span>
                Horario: <strong>{openingTime} - {closingTime}</strong>
              </span>
              {serviceFormat ? (
                <span style={{ marginLeft: "auto", fontWeight: "600" }}>
                  {serviceFormat}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="detalle-producto-booking-form">
            <label>
              <span>Dia de la reserva</span>
              <input
                type="date"
                value={travelDate}
                onChange={(event) => {
                  setTravelDate(event.target.value);
                  setReservationFeedback("");
                }}
              />
            </label>

            <div style={{ marginTop: "1rem" }}>
              <span
                style={{ fontSize: "0.9rem", fontWeight: "700", color: "#444" }}
              >
                Comensales
              </span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                  marginTop: "0.5rem",
                }}
              >
                {passengerFields.map((field, index) => (
                  <div
                    key={field.id || `restaurant-passenger-${index}`}
                    style={{ display: "flex", flexDirection: "column" }}
                  >
                    <label
                      style={{
                        fontSize: "0.8rem",
                        color: "#666",
                        marginBottom: "3px",
                      }}
                    >
                      {field.label}
                    </label>
                    <input
                      type="number"
                      min={field.min}
                      value={passengerCounts[field.id]}
                      onChange={(event) => {
                        setPassengerCounts({
                          ...passengerCounts,
                          [field.id]: Number(event.target.value),
                        });
                        setReservationFeedback("");
                      }}
                      style={{
                        padding: "0.5rem",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "1.5rem",
              borderTop: "1px solid #eee",
              paddingTop: "1rem",
            }}
          >
            {passengerBreakdown.map((item, index) => (
              <div
                key={item.id || `restaurant-breakdown-${index}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                <span>
                  {item.label} x{item.count}
                </span>
                <strong style={{ color: "#333" }}>
                  {formatBookingAmount(item.subtotal)}
                </strong>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "1rem",
                padding: "1rem",
                background: "#f8f9fa",
                borderRadius: "12px",
              }}
            >
              <span style={{ fontWeight: "700", color: "#111" }}>
                Total estimado
              </span>
              <strong style={{ fontSize: "1.2rem", color: theme.primary }}>
                {formatBookingAmount(estimatedTotal)}
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenReservationFlow}
            style={{
              width: "100%",
              marginTop: "1.5rem",
              padding: "1rem",
              background: theme.accent,
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontWeight: "800",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
          >
            CONFIRMAR RESERVA
          </button>

          {reservationFeedback ? (
            <p className="detalle-producto-booking-coupon-feedback detalle-producto-booking-coupon-feedback--error">
              {reservationFeedback}
            </p>
          ) : null}
        </div>

        <style>{`
          .restaurant-theme {
            box-shadow: 0 10px 30px ${theme.shadow} !important;
            border: 1px solid ${theme.surfaceStrong} !important;
          }
        `}</style>
      </aside>

      <ProductReservationFlowModal
        open={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        bookingSnapshot={bookingSnapshot}
      />
    </>
  );
}
