export default function DestinationLogistics({
  climateCards,
  destinationName,
  logistics,
  climateSectionRef,
  logisticsSectionRef,
}) {
  return (
    <>
      <section
        className="destino-section destino-section--surface destino-anchor-target"
        ref={logisticsSectionRef}
      >
        <div className="destino-shell">
          <div className="destino-section-heading">
            <h2>{`Como llegar a ${destinationName}`}</h2>
            <p>Las mejores opciones para llegar sin complicaciones</p>
          </div>

          <div className="destino-logistics-grid">
            <article className="destino-logistics-map">
              <img alt={logistics.locationLabel} src={logistics.mapImage} />
              <div className="destino-logistics-pin">
                <span className="material-icons-outlined" aria-hidden="true">
                  location_on
                </span>
              </div>
              <div className="destino-logistics-card">
                <strong>{logistics.locationLabel}</strong>
                <span>{logistics.coordinates}</span>
              </div>
            </article>

            <div className="destino-logistics-copy">
              <div className="destino-logistics-stack">
                <h3>Puertas de entrada</h3>
                {logistics.accessItems.map((item) => (
                  <article key={item.title} className="destino-info-card">
                    <span
                      className="material-icons-outlined"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                    </div>
                  </article>
                ))}
              </div>

              <article className="destino-alert-card">
                <h4>
                  <span className="material-icons-outlined" aria-hidden="true">
                    warning
                  </span>
                  Requisitos de viaje
                </h4>
                <ul>
                  {logistics.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section
        className="destino-section destino-section--primary destino-anchor-target"
        ref={climateSectionRef}
      >
        <div className="destino-shell">
          <div className="destino-section-heading destino-section-heading--light">
            <h2>Clima y cuando viajar</h2>
            <p>Planea tu visita segun el pulso de la selva.</p>
          </div>

          <p className="destino-climate-note">
            La temporada mas recomendada suele ir de diciembre a abril, cuando
            hay menos lluvias y los dias se prestan mejor para playa, caminatas
            y planes al aire libre.
          </p>

          <div className="destino-climate-grid">
            {climateCards.map((card) => (
              <article
                key={card.label}
                className={`destino-climate-card destino-climate-card--${card.tone}`}
              >
                <span className="material-icons-outlined" aria-hidden="true">
                  {card.icon}
                </span>
                <strong>{card.value}</strong>
                <p>{card.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
