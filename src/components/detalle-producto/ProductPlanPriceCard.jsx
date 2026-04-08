import { getProductCategoryCssVars } from "../../utils/productCategoryThemes";

function formatBookingPrice(value) {
  if (!value) return null;
  const normalizedValue = String(value).trim();
  const digits = normalizedValue.replace(/\D/g, "");
  if (digits) {
    return `$${new Intl.NumberFormat("es-CO").format(Number(digits))}`;
  }
  return normalizedValue.startsWith("$") ? normalizedValue : `$${normalizedValue}`;
}

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function formatMonthDayLabel(monthDay) {
  const [month, day] = String(monthDay ?? "").split("-");
  const monthIndex = Number(month) - 1;
  const dayNumber = Number(day);
  if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex >= MONTH_LABELS.length || !Number.isInteger(dayNumber) || dayNumber <= 0) return "";
  return `${dayNumber} ${MONTH_LABELS[monthIndex]}`;
}

function formatSeasonPeriodLabel(period = {}) {
  const label = String(period.label ?? "").trim();
  const startLabel = formatMonthDayLabel(period.startMonthDay);
  const endLabel = formatMonthDayLabel(period.endMonthDay);
  const rangeLabel = startLabel && endLabel ? `${startLabel} a ${endLabel}` : "";

  if (!label) return rangeLabel || "Periodo por definir";
  if (!rangeLabel) return label;
  
  // Si el label ya parece contener las fechas, no las repetimos
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes(startLabel.toLowerCase()) || lowerLabel.includes(endLabel.toLowerCase())) {
    return label;
  }

  return `${label}: ${rangeLabel}`;
}

function getDateInputValue(monthDay) {
  return monthDay ? `2026-${monthDay}` : "";
}

function getMonthDayFromInputValue(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.slice(5) : "";
}

function PriceEditAction({ isActive = false, onClick }) {
  return (
    <button type="button" className={`detalle-producto-edit-action${isActive ? " detalle-producto-edit-action--active" : ""}`} onClick={onClick}>
      <span className="material-icons-outlined" aria-hidden="true">edit</span>
      <span>{isActive ? "Gestionar Tarifas" : "Editar"}</span>
    </button>
  );
}

function PriceInputField({ label, value, onChange }) {
  return (
    <label className="detalle-producto-admin-edit-field detalle-producto-price-card-field">
      <span>{label}</span>
      <input type="text" inputMode="numeric" value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function InlineActionButton({ label, icon, onClick, variant = "add" }) {
  return (
    <button type="button" className={`detalle-producto-inline-action detalle-producto-inline-action--${variant}`} onClick={onClick}>
      <span className="material-icons-outlined" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function PriceGrid({ items = [], tone = "default", isEditing = false, onPriceChange }) {
  return (
    <div className="detalle-producto-booking-modal-grid">
      {items.map((item, index) => (
        <article className={`detalle-producto-booking-modal-card${tone.includes("group") ? " detalle-producto-booking-modal-card--group" : ""}${tone.includes("high") ? " detalle-producto-booking-modal-card--high" : ""}`} key={`${tone}-${item.id}`}>
          <span>{item.label}</span>
          {item.ageHint ? <small>{item.ageHint}</small> : null}
          {isEditing ? (
            <PriceInputField label="Precio" value={item.price} onChange={(nextValue) => onPriceChange(index, nextValue)} />
          ) : (
            <strong style={{ color: tone.includes("high") ? "#ffffff" : "inherit" }}>{formatBookingPrice(item.price)}</strong>
          )}
        </article>
      ))}
    </div>
  );
}

function HighSeasonPeriodsEditor({ periods = [], isEditing = false, onPeriodChange = () => {}, onAddPeriod = () => {}, onRemovePeriod = () => {} }) {
  return (
    <section className="detalle-producto-price-card-periods">
      <div className="detalle-producto-price-card-periods-head">
        <div className="detalle-producto-price-card-periods-copy">
          <p>FECHAS DE TEMPORADA ALTA</p>
        </div>
        {isEditing ? <InlineActionButton label="Agregar periodo" icon="add" onClick={onAddPeriod} /> : null}
      </div>

      {periods.length > 0 ? (
        <div className={isEditing ? "detalle-producto-price-card-period-list" : ""} style={!isEditing ? { display: "flex", flexWrap: "wrap", gap: "0.4rem" } : undefined}>
          {periods.map((period, index) => (
            isEditing ? (
              <article className="detalle-producto-price-card-period" key={period.id}>
                <label className="detalle-producto-admin-edit-field detalle-producto-price-card-field">
                  <span>Nombre Temporada</span>
                  <input type="text" value={period.label ?? ""} onChange={(event) => onPeriodChange(index, "label", event.target.value)} placeholder="Ej. Semana Santa" />
                </label>
                <div className="detalle-producto-price-card-period-dates">
                  <label className="detalle-producto-admin-edit-field detalle-producto-price-card-field">
                    <span>Inicio</span>
                    <input type="date" value={getDateInputValue(period.startMonthDay)} onChange={(event) => onPeriodChange(index, "startMonthDay", getMonthDayFromInputValue(event.target.value))} />
                  </label>
                  <label className="detalle-producto-admin-edit-field detalle-producto-price-card-field">
                    <span>Fin</span>
                    <input type="date" value={getDateInputValue(period.endMonthDay)} onChange={(event) => onPeriodChange(index, "endMonthDay", getMonthDayFromInputValue(event.target.value))} />
                  </label>
                </div>
                <InlineActionButton label="Eliminar" icon="delete" variant="remove" onClick={() => onRemovePeriod(index)} />
              </article>
            ) : (
              <span key={period.id} style={{ backgroundColor: "var(--product-theme-primary)", color: "white", padding: "4px 9px", fontSize: "0.72rem", borderRadius: "12px", fontWeight: "600", display: "inline-block" }}>
                {formatSeasonPeriodLabel(period)}
              </span>
            )
          ))}
        </div>
      ) : (
        <p className="detalle-producto-create-empty">No hay periodos de temporada alta definidos todavia.</p>
      )}
    </section>
  );
}

export default function ProductPlanPriceCard({
  draft,
  isEditingEnabled = false,
  activeBlock = null,
  onActivateBlock = () => {},
  onBasePriceChange = () => {},
  onGridPriceChange = () => {},
  onUpdatePeriod = () => {},
  onAddPeriod = () => {},
  onRemovePeriod = () => {},
}) {
  const categoryThemeStyle = getProductCategoryCssVars("planes");
  const booking = draft?.booking || {};
  const pricingDetails = booking.pricingDetails || {};
  const seasonalPricing = pricingDetails.seasons || {};
  const isPricingActive = isEditingEnabled && activeBlock === "pricing";

  return (
    <aside className={`detalle-producto-booking-card detalle-producto-booking-card--planes detalle-producto-price-card${isPricingActive ? " detalle-producto-price-card--editing" : ""}`} style={categoryThemeStyle}>
      <div className="detalle-producto-booking-top" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "1.1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255, 255, 255, 0.9)" }}>Tarifa Plan</span>
          <div style={{ display: "grid", gap: "0.1rem" }}>
            <strong style={{ fontSize: "1.9rem", color: "#ffffff", lineHeight: "1", display: "block" }}>{formatBookingPrice(booking.price)}</strong>
            <small style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.9)", fontWeight: "700", paddingTop: "0.2rem", display: "block" }}>Adulto - Temporada baja</small>
          </div>
        </div>

        <div style={{ display: "grid", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255, 255, 255, 0.85)" }}>FECHAS DE ALTA</span>
          {seasonalPricing?.high?.periods?.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
              {seasonalPricing.high.periods.map((period) => (
                <span key={period.id} style={{ backgroundColor: "var(--product-theme-chip-bg)", color: "var(--product-theme-chip-text)", padding: "3.5px 7px", fontSize: "0.68rem", borderRadius: "12px", fontWeight: "800", display: "inline-block", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                  {formatSeasonPeriodLabel(period)}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: "0.68rem", color: "rgba(255, 255, 255, 0.7)" }}>No hay fechas especiales</span>
          )}
        </div>
      </div>

      <div className="detalle-producto-price-card-body">
        {isEditingEnabled ? (
          <div className="detalle-producto-price-card-edit-head">
            <span style={{ fontWeight: "800", fontSize: "0.95rem" }}>Matriz de Precios</span>
            <PriceEditAction isActive={isPricingActive} onClick={() => onActivateBlock("pricing")} />
          </div>
        ) : null}

        {isPricingActive ? (
          <div className="detalle-producto-price-card-summary">
            <p>Este es el precio base que se mostrará en los resultados de búsqueda.</p>
            <PriceInputField label="Precio Adulto (Baja)" value={booking.price} onChange={onBasePriceChange} />
          </div>
        ) : null}

        {seasonalPricing?.high && isPricingActive ? (
          <HighSeasonPeriodsEditor
            periods={seasonalPricing.high.periods ?? []}
            isEditing={isPricingActive}
            onPeriodChange={onUpdatePeriod}
            onAddPeriod={onAddPeriod}
            onRemovePeriod={onRemovePeriod}
          />
        ) : null}

        {["low", "high"].map((seasonKey) => {
          const season = seasonalPricing[seasonKey];
          if (!season) return null;

          return (
            <section className={`detalle-producto-price-card-section${seasonKey === "high" ? " detalle-producto-price-card-section--high" : ""}`} key={seasonKey} style={{ borderBottom: seasonKey === "low" ? "1px dashed #eee" : "none", paddingBottom: seasonKey === "low" ? "1.5rem" : "0.5rem" }}>
              <div className="detalle-producto-price-card-section-head">
                <h4 style={{ color: seasonKey === "high" ? "var(--product-theme-primary)" : "#111", fontSize: "0.85rem", fontWeight: "800" }}>{season.title.toUpperCase()}</h4>
                {season.note ? (
                  <p className="detalle-producto-booking-modal-rule" style={{ marginTop: "0.4rem" }}>
                    {season.note}
                  </p>
                ) : null}
                {seasonKey === "high" && season.periods?.length > 0 ? (
                  <div className="detalle-producto-booking-modal-rule" style={{ marginTop: "0.6rem" }}>
                    <p style={{ fontWeight: "700", color: "#666", marginBottom: "0.25rem" }}>Fechas aplicables:</p>
                    <ul className="detalle-producto-booking-modal-periods" style={{ listStyle: "disc", paddingLeft: "1.2rem" }}>
                      {season.periods.map((period) => (
                        <li key={period.id} style={{ color: "#444", marginBottom: "0.2rem" }}>
                          {formatSeasonPeriodLabel(period)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <p style={{ fontSize: "0.65rem", fontWeight: "800", color: "#888", marginTop: "1rem", marginBottom: "0.5rem", textTransform: "uppercase" }}>TARIFA INDIVIDUAL</p>
              <PriceGrid
                items={season.individual ?? []}
                tone={seasonKey === "high" ? "high" : "default"}
                isEditing={isPricingActive}
                onPriceChange={(idx, val) => onGridPriceChange(seasonKey, "individual", idx, val)}
              />

              <h4 className="detalle-producto-booking-modal-subhead" style={{ marginTop: "1rem", fontSize: "0.65rem", fontWeight: "800", color: "#888", textTransform: "uppercase" }}>TARIFA PARA GRUPOS</h4>
              {isPricingActive ? (
                 <p className="detalle-producto-booking-modal-rule" style={{ marginBottom: "0.8rem" }}>{pricingDetails.groupRule}</p>
              ) : null}

              <PriceGrid
                items={season.group ?? []}
                tone={seasonKey === "high" ? "high-group" : "group"}
                isEditing={isPricingActive}
                onPriceChange={(idx, val) => onGridPriceChange(seasonKey, "group", idx, val)}
              />
            </section>
          );
        })}
      </div>
    </aside>
  );
}
