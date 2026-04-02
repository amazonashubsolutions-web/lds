export default function DestinationStaySection({
  cuisine,
  destinationName,
  cuisineSectionRef,
  staySectionRef,
  stayOptions,
}) {
  return (
    <>
      <section className="destino-section destino-anchor-target" ref={staySectionRef}>
        <div className="destino-shell">
          <div className="destino-section-heading">
            <h2>Donde hospedarse</h2>
            <p>Elige entre ciudad, hostales de paso o lodges inmersivos en selva.</p>
          </div>

          <div className="destino-stay-options">
            {stayOptions.map((option) => (
              <article
                key={option.title}
                className={
                  option.highlight
                    ? "destino-stay-card destino-stay-card--highlight"
                    : "destino-stay-card"
                }
              >
                <div className="destino-stay-card-icon" aria-hidden="true">
                  <span className="material-icons-outlined">{option.icon}</span>
                </div>
                <div className="destino-stay-card-copy">
                  <strong>{option.title}</strong>
                  <p>{option.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="destino-section destino-section--surface destino-anchor-target"
        ref={cuisineSectionRef}
      >
        <div className="destino-shell destino-gastronomy-grid">
          <div className="destino-gastronomy-media">
            <img alt={`Sabores de ${destinationName}`} src={cuisine.image} />
          </div>

          <div className="destino-gastronomy-copy">
            <div className="destino-section-heading">
              <h2>Gastronomia</h2>
              <p>{cuisine.intro}</p>
            </div>

            <div className="destino-gastronomy-list">
              {cuisine.dishes.map((dish) => (
                <article key={dish.title} className="destino-gastronomy-item">
                  <span className="material-icons-outlined" aria-hidden="true">
                    {dish.icon}
                  </span>
                  <div>
                    <strong>{dish.title}</strong>
                    <p>{dish.description}</p>
                  </div>
                </article>
              ))}
            </div>

            <blockquote>{cuisine.recommendation}</blockquote>
          </div>
        </div>
      </section>
    </>
  );
}
