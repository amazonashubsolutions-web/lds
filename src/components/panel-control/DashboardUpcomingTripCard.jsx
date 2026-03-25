export default function DashboardUpcomingTripCard({ trip }) {
  return (
    <article className="panel-control-upcoming-card">
      <div className="panel-control-upcoming-media">
        <img alt={trip.title} src={trip.image} />
        <div className="panel-control-upcoming-badge">{trip.badge}</div>
        <div className="panel-control-upcoming-copy">
          <h3>{trip.title}</h3>
          <p>{trip.subtitle}</p>
        </div>
      </div>

      <div className="panel-control-upcoming-footer">
        <div>
          <span>Fecha</span>
          <strong>{trip.checkIn}</strong>
        </div>
        <div>
          <span>Viajeros</span>
          <strong>{trip.guests}</strong>
        </div>
        <button type="button">Gestionar</button>
      </div>
    </article>
  );
}
