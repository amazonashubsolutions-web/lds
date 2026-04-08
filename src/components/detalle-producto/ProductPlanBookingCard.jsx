import { useMemo, useState } from "react";
import {
  getProductCategoryCssVars,
  getProductCategoryTheme,
} from "../../utils/productCategoryThemes";

function formatBookingAmount(value) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

function parseBookingPrice(value) {
  if (!value) return 0;
  const digits = String(value).replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export default function ProductPlanBookingCard({ booking, initialTravelDate = "" }) {
  const theme = getProductCategoryTheme("planes");
  const categoryThemeStyle = getProductCategoryCssVars("planes");
  const passengerFields = booking.passengerFields ?? [
    { id: "adults", label: "Adultos", min: 1, defaultValue: 1 },
    { id: "children", label: "Niños (3-10 años)", min: 0, defaultValue: 0 },
    { id: "babies", label: "Bebés (0-2 años)", min: 0, defaultValue: 0 },
  ];

  const [passengerCounts, setPassengerCounts] = useState(() => 
    passengerFields.reduce((acc, f) => ({ ...acc, [f.id]: f.defaultValue || 0 }), {})
  );

  const [travelDate, setTravelDate] = useState(initialTravelDate || new Date().toISOString().split("T")[0]);

  const pricingDetails = booking.pricingDetails || {};
  const seasons = useMemo(() => pricingDetails.seasons || {}, [pricingDetails.seasons]);
  const groupMin = pricingDetails.groupMinPassengers || 6;

  // Season Selection Logic
  const activeSeasonKey = useMemo(() => {
    if (!travelDate || !seasons.high?.periods) return "low";
    
    // Extract Month-Day from YYYY-MM-DD
    const [_, month, day] = travelDate.split("-");
    const currentMD = `${month}-${day}`;

    const isHighSeason = seasons.high.periods.some(period => {
      const start = period.startMonthDay;
      const end = period.endMonthDay;
      if (!start || !end) return false;

      if (start <= end) {
        return currentMD >= start && currentMD <= end;
      } else {
        // Overlaps year end (e.g., Dec 15 to Jan 15)
        return currentMD >= start || currentMD <= end;
      }
    });

    return isHighSeason ? "high" : "low";
  }, [travelDate, seasons]);

  const activeSeason = seasons[activeSeasonKey] || seasons.low || {};
  const totalPassengers = Object.values(passengerCounts).reduce((a, b) => a + b, 0);
  const isGroupRate = totalPassengers >= groupMin;

  const currentPricingGrid = isGroupRate ? activeSeason.group : activeSeason.individual;

  const breakdown = passengerFields.map(f => {
    const count = passengerCounts[f.id] || 0;
    const priceItem = currentPricingGrid?.find(p => p.id === f.id);
    const unitPrice = parseBookingPrice(priceItem?.price);
    return { 
      id: f.id, 
      label: f.label, 
      count, 
      unitPrice,
      subtotal: count * unitPrice 
    };
  }).filter(i => i.count > 0);

  const estimatedTotal = breakdown.reduce((s, i) => s + i.subtotal, 0);

  const handleApplyBooking = () => {
    alert(`Solicitud de reserva enviada para ${totalPassengers} personas el día ${travelDate}. Total: ${formatBookingAmount(estimatedTotal)}`);
  };

  return (
    <aside className="detalle-producto-booking-card plan-theme" style={categoryThemeStyle}>
      <div style={{ 
        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`, 
        padding: "1.5rem", 
        borderRadius: "16px 16px 0 0", 
        color: "#fff",
        textAlign: "left",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{ fontSize: "0.7rem", fontWeight: "800", textTransform: "uppercase", color: "rgba(255,255,255,0.9)", letterSpacing: "0.05em" }}>Reserva de Plan</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.2rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "900", color: "#ffffff" }}>{formatBookingAmount(estimatedTotal)}</h3>
            <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.9)" }}>/ total</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.6rem" }}>
            <span className={`material-icons-outlined`} style={{ fontSize: "1rem", color: "#ffffff" }}>
              {activeSeasonKey === "high" ? "trending_up" : "wb_sunny"}
            </span>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", color: "#ffffff" }}>
              {activeSeasonKey === "high" ? "Temporada Alta" : "Temporada Baja"}
            </span>
            {isGroupRate && (
              <span style={{ marginLeft: "auto", background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "20px", fontSize: "0.65rem", fontWeight: "800" }}>
                TARIFA GRUPAL
              </span>
            )}
          </div>
        </div>
        <span className="material-icons-outlined" style={{ position: "absolute", right: "-10px", bottom: "-10px", fontSize: "6rem", opacity: 0.1 }}>assignment</span>
      </div>

      <div style={{ padding: "1.5rem", background: "#fff", borderRadius: "0 0 16px 16px" }}>
        <div className="detalle-producto-booking-form">
          <label style={{ display: "block", marginBottom: "1.2rem" }}>
            <span style={{ display: "block", fontSize: "0.8rem", fontWeight: "800", color: "#666", marginBottom: "0.4rem", textTransform: "uppercase" }}>Fecha de Inicio</span>
            <input 
              type="date" 
              value={travelDate} 
              onChange={e => setTravelDate(e.target.value)} 
              style={{ width: "100%", padding: "0.8rem", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.95rem", fontWeight: "600" }}
            />
          </label>

          <span style={{ display: "block", fontSize: "0.8rem", fontWeight: "800", color: "#666", marginBottom: "0.8rem", textTransform: "uppercase" }}>Viajeros</span>
          <div style={{ display: "grid", gap: "0.8rem" }}>
            {passengerFields.map(f => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "0.8rem", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                <div>
                  <span style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", color: "#334155" }}>{f.label}</span>
                  <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{formatBookingAmount(breakdown.find(b => b.id === f.id)?.unitPrice || 0)} c/u</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <button 
                    onClick={() => setPassengerCounts(p => ({ ...p, [f.id]: Math.max(f.min || 0, p[f.id] - 1) }))}
                    style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" }}
                  >-</button>
                  <span style={{ minWidth: "20px", textAlign: "center", fontWeight: "800", color: "#0f172a" }}>{passengerCounts[f.id]}</span>
                  <button 
                    onClick={() => setPassengerCounts(p => ({ ...p, [f.id]: p[f.id] + 1 }))}
                    style={{ width: "28px", height: "28px", borderRadius: "50%", border: `1px solid ${theme.accent}`, background: theme.accent, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" }}
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isGroupRate && (
          <div style={{ marginTop: "1rem", padding: "0.7rem", background: "#f1f5f9", borderRadius: "10px", fontSize: "0.75rem", color: "#475569", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span className="material-icons-outlined" style={{ fontSize: "1.1rem" }}>info</span>
            <span>Agrega {groupMin - totalPassengers} personas más para activar la <strong>Tarifa Grupal</strong>.</span>
          </div>
        )}

        <div style={{ marginTop: "1.5rem", borderTop: "2px dashed #eee", paddingTop: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
             <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "#64748b" }}>Subtotal</span>
             <strong style={{ fontSize: "1.1rem", color: "#0f172a" }}>{formatBookingAmount(estimatedTotal)}</strong>
          </div>
        </div>

        <button 
          onClick={handleApplyBooking}
          disabled={totalPassengers === 0}
          style={{ 
            width: "100%", marginTop: "1.5rem", padding: "1.1rem", background: theme.accent, color: "#fff", border: "none", borderRadius: "14px", fontWeight: "900", fontSize: "1rem", cursor: "pointer", transition: "all 0.2s ease",
            boxShadow: `0 10px 15px -3px ${theme.shadow}`, opacity: totalPassengers === 0 ? 0.6 : 1
          }}
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
  );
}
