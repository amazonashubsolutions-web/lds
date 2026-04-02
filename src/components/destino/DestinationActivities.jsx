export default function DestinationActivities({
  activities,
  destinationName,
  sectionRef,
}) {
  return (
    <section
      className="destino-section destino-section--soft destino-anchor-target"
      ref={sectionRef}
    >
      <div className="destino-shell">
        <div className="destino-section-heading">
          <h2>{`Que hacer en ${destinationName}`}</h2>
          <p>Una mezcla de selva, ciudad, cultura y sabor en el mismo itinerario.</p>
        </div>

        <div className="destino-activities-grid">
          {activities.map((item) => (
            <article key={item.title} className="destino-activity-card">
              <div className="destino-activity-media">
                <img alt={item.title} src={item.image} />
              </div>
              <div className="destino-activity-body">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
