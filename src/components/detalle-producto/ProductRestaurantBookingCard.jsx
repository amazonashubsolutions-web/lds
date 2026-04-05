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

function formatBookingPrice(value) {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  return digits ? `$${new Intl.NumberFormat("es-CO").format(Number(digits))}` : value;
}

function formatBookingAmount(value) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

function parseBookingPrice(value) {
  return value ? Number(String(value).replace(/\D/g, "")) : 0;
}

export default function ProductRestaurantBookingCard({ booking, initialTravelDate = "" }) {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponFeedback, setCouponFeedback] = useState(null);

  // Restaurant Specific Metadata (Extracted from booking or product object)
  const { foodStyle, serviceFormat, openingTime, closingTime } = booking.metaRestaurant || {};

  const passengerFields = booking.passengerFields ?? [
    { id: "adults", label: "Comensales Adultos", min: 1, defaultValue: 2 },
    { id: "children", label: "Niños", min: 0, defaultValue: 0 },
  ];

  const [passengerCounts, setPassengerCounts] = useState(() => 
    passengerFields.reduce((acc, f) => ({ ...acc, [f.id]: f.defaultValue || 0 }), {})
  );

  const pricingDetails = booking.pricingDetails;
  const [travelDate, setTravelDate] = useState(initialTravelDate || new Date().toISOString().split("T")[0]);

  // Pricing Logic (Isolated instance)
  const seasonalPricing = pricingDetails?.seasons;
  // Simplified season check for this isolated component
  const activeSeasonKey = "low"; // TODO: Implement full season logic if needed, or keep simple for restaurants
  const activeSeason = seasonalPricing?.[activeSeasonKey] ?? seasonalPricing?.low ?? null;
  const activeIndividualPricing = activeSeason?.individual ?? pricingDetails?.individual ?? [];
  
  const totalPassengers = Object.values(passengerCounts).reduce((a, b) => a + b, 0);
  const passengerBreakdown = passengerFields.map(f => {
    const count = passengerCounts[f.id] || 0;
    const priceItem = activeIndividualPricing.find(p => p.id === f.id);
    const unitPrice = parseBookingPrice(priceItem?.price);
    return { id: f.id, label: f.label, count, subtotal: count * unitPrice };
  }).filter(i => i.count > 0);

  const estimatedTotal = passengerBreakdown.reduce((s, i) => s + i.subtotal, 0);

  const handleApplyCoupon = () => {
     // Simulation of coupon application
     setAppliedCouponCode(couponCode);
     setCouponFeedback({ tone: "success", message: "Cupon aplicado!" });
  };

  return (
    <aside className="detalle-producto-booking-card restaurant-theme">
      {/* Premium Foodie Header */}
      <div style={{ 
        background: "linear-gradient(135deg, #F78A00 0%, #FFB347 100%)", 
        padding: "1.5rem", 
        borderRadius: "16px 16px 0 0", 
        color: "#fff",
        textAlign: "center",
        boxShadow: "inset 0 -10px 20px rgba(0,0,0,0.05)"
      }}>
        <span className="material-icons-outlined" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>restaurant</span>
        <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", letterSpacing: "0.5px" }}>EXPERIENCIA GOURMET</h3>
        {foodStyle && (
          <div style={{ 
            fontSize: "0.9rem", 
            marginTop: "0.4rem", 
            background: "rgba(255,255,255,0.2)", 
            padding: "2px 10px", 
            borderRadius: "20px",
            display: "inline-block"
          }}>
            Cocina {foodStyle}
          </div>
        )}
      </div>

      <div style={{ padding: "1.5rem", background: "#fff", borderRadius: "0 0 16px 16px" }}>
        {/* Restaurant Schedule Info */}
        {(openingTime || closingTime) && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "0.5rem", 
            color: "#666", 
            fontSize: "0.85rem", 
            marginBottom: "1rem",
            padding: "0.5rem",
            background: "#fff9f0",
            borderRadius: "8px",
            border: "1px dashed #FFB347"
          }}>
            <span className="material-icons-outlined" style={{ fontSize: "1.2rem", color: "#F78A00" }}>schedule</span>
            <span>Horario: <strong>{openingTime} - {closingTime}</strong></span>
            {serviceFormat && <span style={{ marginLeft: "auto", fontWeight: "600" }}>{serviceFormat}</span>}
          </div>
        )}

        <div className="detalle-producto-booking-form">
          <label>
            <span>Día de la Reserva</span>
            <input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)} />
          </label>

          <div style={{ marginTop: "1rem" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "#444" }}>Comensales</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
              {passengerFields.map(f => (
                <div key={f.id} style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "0.8rem", color: "#666", marginBottom: "3px" }}>{f.label}</label>
                  <input 
                    type="number" 
                    min={f.min} 
                    value={passengerCounts[f.id]} 
                    onChange={e => setPassengerCounts({...passengerCounts, [f.id]: Number(e.target.value)})}
                    style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid #ddd" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "1.5rem", borderTop: "1px solid #eee", paddingTop: "1rem" }}>
          {passengerBreakdown.map(i => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              <span>{i.label} x{i.count}</span>
              <strong style={{ color: "#333" }}>{formatBookingAmount(i.subtotal)}</strong>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", padding: "1rem", background: "#f8f9fa", borderRadius: "12px" }}>
            <span style={{ fontWeight: "700", color: "#111" }}>Total Estimado</span>
            <strong style={{ fontSize: "1.2rem", color: "#F78A00" }}>{formatBookingAmount(estimatedTotal)}</strong>
          </div>
        </div>

        <button type="button" style={{ 
          width: "100%", 
          marginTop: "1.5rem", 
          padding: "1rem", 
          background: "#1f2937", 
          color: "#fff", 
          border: "none", 
          borderRadius: "12px", 
          fontWeight: "800",
          cursor: "pointer",
          transition: "transform 0.2s"
        }}>
          CONFIRMAR RESERVA
        </button>
      </div>

      <style>{`
        .restaurant-theme {
          box-shadow: 0 10px 30px rgba(247, 138, 0, 0.15) !important;
          border: 1px solid #FFB347 !important;
        }
      `}</style>
    </aside>
  );
}
