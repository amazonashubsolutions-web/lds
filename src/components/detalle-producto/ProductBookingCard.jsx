export default function ProductBookingCard({ booking }) {
  return (
    <aside className="detalle-producto-booking-card">
      <div className="detalle-producto-booking-top">
        <span>Desde</span>
        <strong>${booking.price}</strong>
        <small>{booking.unitLabel ?? "por persona"}</small>
      </div>

      <div className="detalle-producto-booking-form">
        <label>
          <span>Fecha</span>
          <input type="date" />
        </label>
        <label>
          <span>Viajeros</span>
          <select defaultValue="2 viajeros">
            <option>1 viajero</option>
            <option>2 viajeros</option>
            <option>3 viajeros</option>
            <option>4 viajeros</option>
          </select>
        </label>
        <button type="button">{booking.buttonLabel ?? "Reservar ahora"}</button>
      </div>

      <div className="detalle-producto-booking-breakdown">
        {booking.breakdown.map((item) => (
          <div className="detalle-producto-booking-row" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
        <div className="detalle-producto-booking-row detalle-producto-booking-row--total">
          <span>Total estimado</span>
          <strong>{booking.total}</strong>
        </div>
      </div>

      <p className="detalle-producto-booking-note">{booking.note}</p>
    </aside>
  );
}
