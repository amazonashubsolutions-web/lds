import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { usePanelSession } from "../../contexts/PanelSessionContext";
import {
  getProductCategoryCssVars,
  getProductCategoryTheme,
} from "../../utils/productCategoryThemes";
import ProductReservationFlowModal from "./ProductReservationFlowModal";

function formatBookingAmount(value) {
  return `$${new Intl.NumberFormat("es-CO").format(Number(value ?? 0))}`;
}

function parseBookingPrice(value) {
  if (!value) {
    return 0;
  }

  const digits = String(value).replace(/\D/g, "");
  return digits ? Number(digits) : 0;
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
  if (!travelDate || !seasons?.high?.periods) {
    return "low";
  }

  const [, month, day] = travelDate.split("-");
  const currentMonthDay = `${month}-${day}`;

  const isHighSeason = seasons.high.periods.some((period) =>
    isMonthDayWithinRange(
      currentMonthDay,
      period.startMonthDay,
      period.endMonthDay,
    ),
  );

  return isHighSeason ? "high" : "low";
}

export default function ProductPlanBookingCard({
  booking,
  initialTravelDate = "",
  productSummary = null,
}) {
  const theme = getProductCategoryTheme("planes");
  const categoryThemeStyle = getProductCategoryCssVars("planes");
  const location = useLocation();
  const { isAuthenticated } = usePanelSession();
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [reservationFeedback, setReservationFeedback] = useState("");

  const passengerFields = booking.passengerFields ?? [
    { id: "adults", label: "Adultos", min: 1, defaultValue: 1 },
    { id: "children", label: "Niños (3-10 años)", min: 0, defaultValue: 0 },
    { id: "babies", label: "Bebés (0-2 años)", min: 0, defaultValue: 0 },
  ];

  const [passengerCounts, setPassengerCounts] = useState(() =>
    passengerFields.reduce(
      (accumulator, field) => ({
        ...accumulator,
        [field.id]: field.defaultValue || 0,
      }),
      {},
    ),
  );
  const [travelDate, setTravelDate] = useState(
    initialTravelDate || new Date().toISOString().split("T")[0],
  );

  const pricingDetails = booking.pricingDetails || {};
  const seasons = useMemo(() => pricingDetails.seasons || {}, [pricingDetails.seasons]);
  const groupMin = pricingDetails.groupMinPassengers || 6;
  const activeSeasonKey = useMemo(
    () => getActiveSeasonKey(travelDate, seasons),
    [travelDate, seasons],
  );
  const activeSeason = seasons[activeSeasonKey] || seasons.low || {};
  const totalPassengers = Object.values(passengerCounts).reduce(
    (sum, count) => sum + Number(count ?? 0),
    0,
  );
  const isGroupRate = totalPassengers >= groupMin;
  const currentPricingGrid = isGroupRate
    ? activeSeason.group
    : activeSeason.individual;

  const passengerBreakdown = passengerFields
    .map((field) => {
      const count = passengerCounts[field.id] || 0;
      const priceItem = currentPricingGrid?.find((item) => item.id === field.id);
      const unitPrice = parseBookingPrice(priceItem?.price);
      return {
        id: field.id,
        label: field.label,
        count,
        unitPrice,
        subtotal: count * unitPrice,
      };
    })
    .filter((item) => item.count > 0);

  const estimatedTotal = passengerBreakdown.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );

  function handleOpenReservationFlow() {
    if (!travelDate) {
      setReservationFeedback(
        "Selecciona primero la fecha de inicio para continuar.",
      );
      return;
    }

    if (totalPassengers <= 0) {
      setReservationFeedback(
        "Debes indicar al menos un viajero antes de continuar.",
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
    passengerCounts,
    passengerFields,
    passengerBreakdown,
    additionalCharges: [],
    estimatedTotal,
    discountAmount: 0,
    totalAfterDiscount: estimatedTotal,
    appliedCouponCode: "",
    appliedCouponLabel: "",
    summaryNote: "Solicitud de reserva de plan.",
  };

  return (
    <>
      <aside className="detalle-producto-booking-card plan-theme" style={categoryThemeStyle}>
        <div
          style={{
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
            padding: "1.5rem",
            borderRadius: "16px 16px 0 0",
            color: "#fff",
            textAlign: "left",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative", zIndex: 1 }}>
            <span style={{ fontSize: "0.7rem", fontWeight: "800", textTransform: "uppercase", color: "rgba(255,255,255,0.9)", letterSpacing: "0.05em" }}>
              Reserva de plan
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.2rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "900", color: "#ffffff" }}>
                {formatBookingAmount(estimatedTotal)}
              </h3>
              <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.9)" }}>/ total</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.6rem" }}>
              <span className="material-icons-outlined" style={{ fontSize: "1rem", color: "#ffffff" }}>
                {activeSeasonKey === "high" ? "trending_up" : "wb_sunny"}
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", color: "#ffffff" }}>
                {activeSeasonKey === "high" ? "Temporada Alta" : "Temporada Baja"}
              </span>
              {isGroupRate ? (
                <span style={{ marginLeft: "auto", background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "20px", fontSize: "0.65rem", fontWeight: "800" }}>
                  TARIFA GRUPAL
                </span>
              ) : null}
            </div>
          </div>
          <span className="material-icons-outlined" style={{ position: "absolute", right: "-10px", bottom: "-10px", fontSize: "6rem", opacity: 0.1 }}>
            assignment
          </span>
        </div>

        <div style={{ padding: "1.5rem", background: "#fff", borderRadius: "0 0 16px 16px" }}>
          <div className="detalle-producto-booking-form">
            <label style={{ display: "block", marginBottom: "1.2rem" }}>
              <span style={{ display: "block", fontSize: "0.8rem", fontWeight: "800", color: "#666", marginBottom: "0.4rem", textTransform: "uppercase" }}>
                Fecha de inicio
              </span>
              <input
                type="date"
                value={travelDate}
                onChange={(event) => {
                  setTravelDate(event.target.value);
                  setReservationFeedback("");
                }}
                style={{ width: "100%", padding: "0.8rem", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.95rem", fontWeight: "600" }}
              />
            </label>

            <span style={{ display: "block", fontSize: "0.8rem", fontWeight: "800", color: "#666", marginBottom: "0.8rem", textTransform: "uppercase" }}>
              Viajeros
            </span>
            <div style={{ display: "grid", gap: "0.8rem" }}>
              {passengerFields.map((field) => (
                <div key={field.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "0.8rem", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", color: "#334155" }}>
                      {field.label}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                      {formatBookingAmount(passengerBreakdown.find((item) => item.id === field.id)?.unitPrice || 0)} c/u
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPassengerCounts((current) => ({
                          ...current,
                          [field.id]: Math.max(field.min || 0, current[field.id] - 1),
                        }));
                        setReservationFeedback("");
                      }}
                      style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" }}
                    >
                      -
                    </button>
                    <span style={{ minWidth: "20px", textAlign: "center", fontWeight: "800", color: "#0f172a" }}>
                      {passengerCounts[field.id]}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPassengerCounts((current) => ({
                          ...current,
                          [field.id]: current[field.id] + 1,
                        }));
                        setReservationFeedback("");
                      }}
                      style={{ width: "28px", height: "28px", borderRadius: "50%", border: `1px solid ${theme.accent}`, background: theme.accent, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!isGroupRate ? (
            <div style={{ marginTop: "1rem", padding: "0.7rem", background: "#f1f5f9", borderRadius: "10px", fontSize: "0.75rem", color: "#475569", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span className="material-icons-outlined" style={{ fontSize: "1.1rem" }}>
                info
              </span>
              <span>
                Agrega {groupMin - totalPassengers} personas más para activar la <strong>Tarifa Grupal</strong>.
              </span>
            </div>
          ) : null}

          <div style={{ marginTop: "1.5rem", borderTop: "2px dashed #eee", paddingTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "#64748b" }}>
                Subtotal
              </span>
              <strong style={{ fontSize: "1.1rem", color: "#0f172a" }}>
                {formatBookingAmount(estimatedTotal)}
              </strong>
            </div>
          </div>

          {reservationFeedback ? (
            <div className="detalle-producto-booking-feedback detalle-producto-booking-feedback--error">
              {reservationFeedback}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleOpenReservationFlow}
            disabled={totalPassengers === 0}
            style={{ width: "100%", marginTop: "1.5rem", padding: "1.1rem", background: theme.accent, color: "#fff", border: "none", borderRadius: "14px", fontWeight: "900", fontSize: "1rem", cursor: "pointer", transition: "all 0.2s ease", boxShadow: `0 10px 15px -3px ${theme.shadow}`, opacity: totalPassengers === 0 ? 0.6 : 1 }}
          >
            CONFIRMAR RESERVA
          </button>
        </div>

        <style>{`
          .plan-theme {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
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
