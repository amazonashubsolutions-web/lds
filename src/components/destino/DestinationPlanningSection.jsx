export default function DestinationPlanningSection({
  budgetOptions,
  expertQuote,
  planningSectionRef,
  tips,
  tipsSectionRef,
  transportOptions,
}) {
  return (
    <>
      <section
        className="destino-section destino-section--primary destino-anchor-target"
        ref={planningSectionRef}
      >
        <div className="destino-shell">
          <div className="destino-section-heading destino-section-heading--center destino-section-heading--light">
            <h2>Opciones de Transporte</h2>
            <p>
              Transporte local y rangos de presupuesto para viajar con claridad.
            </p>
          </div>

          <div className="destino-transport-row">
            {transportOptions.map((item) => (
              <article key={item.label} className="destino-transport-card">
                <span
                  className="destino-transport-card-icon material-icons-outlined"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <div className="destino-transport-card-copy">
                  <strong>{item.label}</strong>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="destino-budget-intro destino-budget-intro--light">
            <h3>Presupuesto diario recomendado para viajar a la ciudad</h3>
            <p>
              Valores orientativos para planear tu viaje segun la experiencia
              que buscas.
            </p>
          </div>

          <div className="destino-budget-grid">
            {budgetOptions.map((option) => (
              <article
                key={option.title}
                className={
                  option.featured
                    ? "destino-budget-card destino-budget-card--featured"
                    : "destino-budget-card"
                }
              >
                {option.featured ? (
                  <span className="destino-budget-badge">Recomendado</span>
                ) : null}
                <h3>{option.title}</h3>
                <strong>
                  {option.price} <em>{option.period}</em>
                </strong>
                <ul>
                  {option.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="destino-section destino-section--soft destino-anchor-target"
        ref={tipsSectionRef}
      >
        <div className="destino-shell destino-tips-grid">
          <div>
            <div className="destino-section-heading">
              <h2>Consejos de experto</h2>
              <p>
                Pequeños detalles que hacen una gran diferencia en la
                experiencia.
              </p>
            </div>

            <div className="destino-tips-list">
              {tips.map((tip) => (
                <article
                  key={tip.title}
                  className={
                    tip.tone === "warning"
                      ? "destino-tip-card destino-tip-card--warning"
                      : "destino-tip-card"
                  }
                >
                  <span className="material-icons-outlined" aria-hidden="true">
                    {tip.icon}
                  </span>
                  <strong>{tip.title}</strong>
                  <p>{tip.description}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="destino-expert-quote">
            <blockquote>{expertQuote.quote}</blockquote>
            <div>
              <strong>{expertQuote.author}</strong>
              <span>{expertQuote.role}</span>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
