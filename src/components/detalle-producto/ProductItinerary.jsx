export default function ProductItinerary({ items }) {
  return (
    <section className="detalle-producto-section">
      <div className="detalle-producto-section-head">
        <h2>Itinerario</h2>
      </div>

      <div className="detalle-producto-timeline">
        {items.map((item, index) => (
          <article className="detalle-producto-timeline-item" key={item.day}>
            <div className="detalle-producto-timeline-marker">{index + 1}</div>
            <div className="detalle-producto-timeline-body">
              <span>{item.day}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
