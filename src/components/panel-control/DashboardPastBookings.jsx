export default function DashboardPastBookings({ items }) {
  return (
    <section className="panel-control-card">
      <div className="panel-control-card-head">
        <h3>Reservas anteriores</h3>
        <button type="button">Ver todo</button>
      </div>

      <div className="panel-control-bookings-list">
        {items.map((item) => (
          <article className="panel-control-booking-item" key={item.id}>
            <img alt={item.title} src={item.image} />
            <div className="panel-control-booking-copy">
              <strong>{item.title}</strong>
              <span>{item.meta}</span>
            </div>
            <span className="panel-control-booking-arrow" aria-hidden="true">
              ›
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
