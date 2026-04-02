export default function ProductRecommendations({ items }) {
  return (
    <section className="detalle-producto-section detalle-producto-section--surface">
      <div className="detalle-producto-section-head">
        <h2>Recomendaciones para tu paseo</h2>
      </div>

      <div className="detalle-producto-recommendations">
        {items.map((item) => (
          <article className="detalle-producto-recommendation" key={item}>
            <div className="detalle-producto-recommendation-icon" aria-hidden="true">
              <span className="material-icons-outlined">check_circle</span>
            </div>
            <p>{item}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
